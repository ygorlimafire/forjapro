"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"
import { revalidatePath } from "next/cache"
import { stockEntrySchema, stockAdjustSchema } from "@/lib/validations/stock"
import type { ActionResult } from "@/types"
import type { Prisma } from "@prisma/client"

// ─── Warehouse helpers ────────────────────────────────────────────────────────

export async function getOrCreateDefaultWarehouse() {
  let warehouse = await prisma.warehouse.findFirst({ where: { isDefault: true } })
  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: { name: "Estoque Principal", isDefault: true },
    })
  }
  return warehouse
}

export async function getWarehouses() {
  return prisma.warehouse.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
}

// ─── Internal: update ProductStock in same transaction ────────────────────────

type StockDelta = {
  physicalDelta: number
  reservedDelta: number
  costDelta?: { qty: number; unitCost: number } // only for ENTRADA to update avgCost
}

async function applyProductStockDelta(
  tx: Prisma.TransactionClient,
  productId: string,
  warehouseId: string,
  delta: StockDelta
) {
  const existing = await tx.productStock.findUnique({
    where: { productId_warehouseId: { productId, warehouseId } },
  })

  if (!existing) {
    const availableQty = Math.max(0, delta.physicalDelta - delta.reservedDelta)
    const avgCost = delta.costDelta?.unitCost ?? 0
    await tx.productStock.create({
      data: {
        productId,
        warehouseId,
        physicalQty: Math.max(0, delta.physicalDelta),
        reservedQty: Math.max(0, delta.reservedDelta),
        availableQty,
        avgCost,
      },
    })
    return
  }

  const newPhysical = existing.physicalQty + delta.physicalDelta
  const newReserved = existing.reservedQty + delta.reservedDelta
  const newAvailable = newPhysical - newReserved

  let newAvgCost = Number(existing.avgCost)
  if (delta.costDelta && delta.costDelta.qty > 0) {
    // weighted average cost on entry
    const totalQty = existing.physicalQty + delta.costDelta.qty
    newAvgCost = totalQty > 0
      ? (existing.physicalQty * Number(existing.avgCost) + delta.costDelta.qty * delta.costDelta.unitCost) / totalQty
      : delta.costDelta.unitCost
  }

  await tx.productStock.update({
    where: { productId_warehouseId: { productId, warehouseId } },
    data: {
      physicalQty: newPhysical,
      reservedQty: newReserved,
      availableQty: newAvailable,
      avgCost: newAvgCost,
    },
  })
}

// ─── Stock entry (ENTRADA) ────────────────────────────────────────────────────

export async function addStockEntry(formData: unknown): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }

  const parsed = stockEntrySchema.safeParse(formData)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { productId, warehouseId, quantity, unitCost, serialNumbers, notes } = parsed.data
  const totalCost = unitCost ? unitCost * quantity : undefined

  try {
    await prisma.$transaction(async (tx) => {
      await tx.stockMovement.create({
        data: {
          productId,
          warehouseId,
          type: "ENTRADA",
          quantity,
          unitCost: unitCost ?? null,
          totalCost: totalCost ?? null,
          reason: notes ?? null,
          userId: session.user.id,
        },
      })

      await applyProductStockDelta(tx, productId, warehouseId, {
        physicalDelta: quantity,
        reservedDelta: 0,
        costDelta: unitCost ? { qty: quantity, unitCost } : undefined,
      })

      if (serialNumbers?.length) {
        for (const sn of serialNumbers) {
          await tx.stockUnit.upsert({
            where: { serialNumber_productId: { serialNumber: sn, productId } },
            create: { productId, warehouseId, serialNumber: sn, status: "EM_ESTOQUE" },
            update: { status: "EM_ESTOQUE", warehouseId },
          })
        }
      }
    })

    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entity: "StockMovement",
      entityId: productId,
      newData: { type: "ENTRADA", quantity, warehouseId },
    })

    revalidatePath("/estoque")
    revalidatePath(`/estoque/${productId}`)
    return { success: true, data: undefined }
  } catch (err) {
    console.error(err)
    return { success: false, error: "Erro ao registrar entrada" }
  }
}

// ─── Manual adjustment ────────────────────────────────────────────────────────

export async function addStockAdjustment(formData: unknown): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }

  const parsed = stockAdjustSchema.safeParse(formData)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { productId, warehouseId, type, quantity, reason, serialNumber } = parsed.data

  // quantity sign: positive = add, negative = remove
  const isOut = type === "PERDA" || (type === "AJUSTE" && quantity < 0)
  const physicalDelta = type === "PERDA" ? -Math.abs(quantity) : quantity

  try {
    await prisma.$transaction(async (tx) => {
      // Block negative balance unless admin/manager
      if (physicalDelta < 0) {
        const stock = await tx.productStock.findUnique({
          where: { productId_warehouseId: { productId, warehouseId } },
        })
        const current = stock?.availableQty ?? 0
        if (current + physicalDelta < 0) {
          throw new Error(`Saldo insuficiente. Disponível: ${current}`)
        }
      }

      await tx.stockMovement.create({
        data: {
          productId,
          warehouseId,
          type: type as "AJUSTE" | "PERDA" | "DEVOLUCAO",
          quantity: Math.abs(quantity),
          reason,
          serialNumber: serialNumber ?? null,
          userId: session.user.id,
        },
      })

      await applyProductStockDelta(tx, productId, warehouseId, {
        physicalDelta,
        reservedDelta: 0,
      })

      if (serialNumber && isOut) {
        await tx.stockUnit.updateMany({
          where: { serialNumber, productId },
          data: { status: type === "PERDA" ? "PERDA" : "EM_ESTOQUE" },
        })
      }
    })

    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entity: "StockMovement",
      entityId: productId,
      newData: { type, quantity, reason },
    })

    revalidatePath("/estoque")
    revalidatePath(`/estoque/${productId}`)
    return { success: true, data: undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao ajustar estoque"
    return { success: false, error: msg }
  }
}

// ─── Stock entry within transaction (called from purchases.ts) ───────────────

export async function applyStockEntryInTx(
  tx: Prisma.TransactionClient,
  params: {
    productId: string
    warehouseId: string
    quantity: number
    unitCost?: number
    referenceType: string
    referenceId: string
    userId: string
    reason?: string
  }
) {
  const { productId, warehouseId, quantity, unitCost, referenceType, referenceId, userId, reason } = params
  const totalCost = unitCost ? unitCost * quantity : undefined

  await tx.stockMovement.create({
    data: {
      productId,
      warehouseId,
      type: "ENTRADA",
      quantity,
      unitCost: unitCost ?? null,
      totalCost: totalCost ?? null,
      reason: reason ?? null,
      referenceType,
      referenceId,
      userId,
    },
  })

  await applyProductStockDelta(tx, productId, warehouseId, {
    physicalDelta: quantity,
    reservedDelta: 0,
    costDelta: unitCost ? { qty: quantity, unitCost } : undefined,
  })
}

// ─── Supplement existing order reservations after new stock arrives ───────────

export async function refreshOrderReservations(
  tx: Prisma.TransactionClient,
  orderId: string
): Promise<"OK" | "PARCIAL" | "INSUFICIENTE"> {
  const warehouse = await tx.warehouse.findFirst({ where: { isDefault: true } })
  if (!warehouse) return "INSUFICIENTE"

  const order = await tx.salesOrder.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      reservations: { where: { status: "ATIVA" } },
    },
  })
  if (!order) return "INSUFICIENTE"

  const reservedByProduct = new Map<string, number>()
  for (const r of order.reservations) {
    reservedByProduct.set(r.productId, (reservedByProduct.get(r.productId) ?? 0) + r.quantity)
  }

  let fullyReserved = 0
  const stockableItems = order.items.filter((i) => i.productId)

  for (const item of stockableItems) {
    const productId = item.productId!
    const alreadyReserved = reservedByProduct.get(productId) ?? 0
    const stillNeeded = item.quantity - alreadyReserved
    if (stillNeeded <= 0) { fullyReserved++; continue }

    const stock = await tx.productStock.findUnique({
      where: { productId_warehouseId: { productId, warehouseId: warehouse.id } },
    })
    const available = stock?.availableQty ?? 0
    const toReserve = Math.min(available, stillNeeded)

    if (toReserve > 0) {
      await tx.stockReservation.create({
        data: {
          productId,
          warehouseId: warehouse.id,
          orderId,
          quantity: toReserve,
          status: "ATIVA",
        },
      })
      await applyProductStockDelta(tx, productId, warehouse.id, {
        physicalDelta: 0,
        reservedDelta: toReserve,
      })
    }

    if (alreadyReserved + toReserve >= item.quantity) fullyReserved++
  }

  // Custom/avulso items (no productId) count as "reserved" for stockStatus purposes
  const customItemCount = order.items.length - stockableItems.length
  if (fullyReserved + customItemCount === order.items.length) return "OK"
  if (fullyReserved === 0 && order.reservations.length === 0 && stockableItems.length > 0) return "INSUFICIENTE"
  return "PARCIAL"
}

// ─── Settle stock debt for orders delivered via override (no prior reservations) ─

export async function fulfillStockDebtInTx(
  tx: Prisma.TransactionClient,
  orderId: string,
  warehouseId: string,
  userId: string,
  referenceNote: string
) {
  const order = await tx.salesOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
  if (!order) return

  // Sum all SAIDA movements already linked to this order, regardless of source.
  // Covers both the formal-reservation path (fulfillOrderReservations) and any
  // SAIDA created via override/manual entry before this debt-settlement runs.
  // Using SAIDAs as the single source avoids double-counting with BAIXADA reservations.
  const priorSaidas = await tx.stockMovement.findMany({
    where: { referenceType: "SalesOrder", referenceId: orderId, type: "SAIDA" },
    select: { productId: true, quantity: true },
  })
  const alreadySaidaByProduct = new Map<string, number>()
  for (const s of priorSaidas) {
    alreadySaidaByProduct.set(s.productId, (alreadySaidaByProduct.get(s.productId) ?? 0) + s.quantity)
  }

  for (const item of order.items) {
    if (!item.productId) continue
    const alreadyFulfilled = alreadySaidaByProduct.get(item.productId) ?? 0
    const debt = item.quantity - alreadyFulfilled
    if (debt <= 0) continue

    const stock = await tx.productStock.findUnique({
      where: { productId_warehouseId: { productId: item.productId, warehouseId } },
    })
    const toConsume = Math.min(stock?.physicalQty ?? 0, debt)
    if (toConsume <= 0) continue

    await tx.stockMovement.create({
      data: {
        productId: item.productId,
        warehouseId,
        type: "SAIDA",
        quantity: toConsume,
        referenceType: "SalesOrder",
        referenceId: orderId,
        userId,
        reason: referenceNote,
      },
    })

    await applyProductStockDelta(tx, item.productId, warehouseId, {
      physicalDelta: -toConsume,
      reservedDelta: 0,
    })
  }
}

// ─── Reservation (called from proposals.ts) ───────────────────────────────────

export async function createOrderReservations(
  tx: Prisma.TransactionClient,
  orderId: string,
  items: Array<{ productId: string; quantity: number }>
): Promise<"OK" | "PARCIAL" | "INSUFICIENTE"> {
  const warehouse = await tx.warehouse.findFirst({ where: { isDefault: true } })
  if (!warehouse) return "INSUFICIENTE"

  let fullyReserved = 0

  for (const item of items) {
    const stock = await tx.productStock.findUnique({
      where: { productId_warehouseId: { productId: item.productId, warehouseId: warehouse.id } },
    })

    const available = stock?.availableQty ?? 0
    const toReserve = Math.min(available, item.quantity)

    if (toReserve <= 0) continue

    await tx.stockReservation.create({
      data: {
        productId: item.productId,
        warehouseId: warehouse.id,
        orderId,
        quantity: toReserve,
        status: "ATIVA",
      },
    })

    await applyProductStockDelta(tx, item.productId, warehouse.id, {
      physicalDelta: 0,
      reservedDelta: toReserve,
    })

    if (toReserve >= item.quantity) fullyReserved++
  }

  if (fullyReserved === items.length) return "OK"
  if (fullyReserved === 0) return "INSUFICIENTE"
  return "PARCIAL"
}

// ─── Fulfill reservations on ENTREGUE ────────────────────────────────────────

export async function fulfillOrderReservations(
  tx: Prisma.TransactionClient,
  orderId: string,
  userId: string
) {
  const reservations = await tx.stockReservation.findMany({
    where: { orderId, status: "ATIVA" },
  })

  for (const res of reservations) {
    await tx.stockMovement.create({
      data: {
        productId: res.productId,
        warehouseId: res.warehouseId,
        type: "SAIDA",
        quantity: res.quantity,
        referenceType: "SalesOrder",
        referenceId: orderId,
        userId,
      },
    })

    await applyProductStockDelta(tx, res.productId, res.warehouseId, {
      physicalDelta: -res.quantity,
      reservedDelta: -res.quantity,
    })

    await tx.stockReservation.update({
      where: { id: res.id },
      data: { status: "BAIXADA" },
    })
  }
}

// ─── Read queries ─────────────────────────────────────────────────────────────

export async function getStockList() {
  const warehouse = await getOrCreateDefaultWarehouse()

  const products = await prisma.product.findMany({
    where: { deletedAt: null, isActive: true, isCustomizable: false },
    include: {
      category: { select: { name: true } },
      productStocks: {
        where: { warehouseId: warehouse.id },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  })

  return products.map((p) => {
    const stock = p.productStocks[0]
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category.name,
      mainImage: p.mainImage,
      stockMin: p.stockMin,
      physicalQty: stock?.physicalQty ?? 0,
      reservedQty: stock?.reservedQty ?? 0,
      availableQty: stock?.availableQty ?? 0,
      avgCost: Number(stock?.avgCost ?? 0),
    }
  })
}

export async function getStockDetail(productId: string) {
  const warehouse = await getOrCreateDefaultWarehouse()

  const [product, stock, movements, units] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      include: { category: { select: { name: true } } },
    }),
    prisma.productStock.findUnique({
      where: { productId_warehouseId: { productId, warehouseId: warehouse.id } },
    }),
    prisma.stockMovement.findMany({
      where: { productId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.stockUnit.findMany({
      where: { productId },
      include: {
        order: { select: { id: true } },
        customer: { select: { companyName: true, tradeName: true, document: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return { product, stock, movements, units, warehouseId: warehouse.id }
}

export async function getStockSummary() {
  const warehouse = await getOrCreateDefaultWarehouse()
  const stocks = await prisma.productStock.findMany({
    where: { warehouseId: warehouse.id },
    include: { product: { select: { stockMin: true, isCustomizable: true } } },
  })

  const totalValue = stocks.reduce((s, ps) => s + ps.physicalQty * Number(ps.avgCost), 0)
  const lowStock = stocks.filter(
    (ps) => !ps.product.isCustomizable && ps.availableQty <= ps.product.stockMin && ps.product.stockMin > 0
  ).length
  const zeroStock = stocks.filter((ps) => ps.availableQty === 0).length

  return { totalValue, lowStock, zeroStock }
}
