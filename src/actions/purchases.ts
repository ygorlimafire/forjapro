"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"
import { revalidatePath } from "next/cache"
import { can } from "@/lib/rbac"
import { applyStockEntryInTx, refreshOrderReservations, fulfillStockDebtInTx, getOrCreateDefaultWarehouse } from "@/actions/stock"
import type { ActionResult } from "@/types"
import type { PurchaseOrderStatus } from "@prisma/client"
import { addDays } from "date-fns"

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatPurchaseNumber(seq: number): string {
  return `PC-${String(seq).padStart(4, "0")}`
}

// ─── Suppliers ────────────────────────────────────────────────────────────────

export async function getSuppliers() {
  return prisma.supplier.findMany({
    where: { isActive: true, type: "PRODUTO" },
    orderBy: [{ tradeName: "asc" }, { companyName: "asc" }],
  })
}

// ─── Suggested purchases ──────────────────────────────────────────────────────

export async function getSuggestedPurchases() {
  const warehouse = await getOrCreateDefaultWarehouse()

  // 1. Products with availableQty below stockMin
  const products = await prisma.product.findMany({
    where: { deletedAt: null, isActive: true, stockMin: { gt: 0 } },
    include: {
      category: { select: { name: true } },
      productStocks: { where: { warehouseId: warehouse.id }, take: 1 },
    },
    orderBy: { name: "asc" },
  })
  const belowMin = products.filter(
    (p) => (p.productStocks[0]?.availableQty ?? 0) < p.stockMin
  )

  // 2. SalesOrders with unresolved stock debt — includes ENTREGUE via override
  const pendingOrders = await prisma.salesOrder.findMany({
    where: {
      status: { not: "CANCELADO" },
      stockStatus: { in: ["PARCIAL", "INSUFICIENTE"] },
    },
    include: {
      customer: { select: { companyName: true, tradeName: true, document: true } },
      proposal: { select: { number: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true, mainImage: true } } } },
      reservations: { where: { status: "ATIVA" } },
    },
  })

  // Group short quantities per product across all pending orders
  const shortByProduct = new Map<string, { needed: number; orderIds: string[] }>()
  for (const order of pendingOrders) {
    const reservedByProduct = new Map<string, number>()
    for (const r of order.reservations) {
      reservedByProduct.set(r.productId, (reservedByProduct.get(r.productId) ?? 0) + r.quantity)
    }
    for (const item of order.items) {
      const reserved = reservedByProduct.get(item.productId) ?? 0
      const short = item.quantity - reserved
      if (short <= 0) continue
      const existing = shortByProduct.get(item.productId)
      if (existing) {
        existing.needed += short
        if (!existing.orderIds.includes(order.id)) existing.orderIds.push(order.id)
      } else {
        shortByProduct.set(item.productId, { needed: short, orderIds: [order.id] })
      }
    }
  }

  // Build unified list
  const allProductIds = new Set([
    ...belowMin.map((p) => p.id),
    ...shortByProduct.keys(),
  ])

  const suggestions: Array<{
    productId: string
    productName: string
    productSku: string
    productImage: string | null
    category: string
    availableQty: number
    stockMin: number
    deficitFromMin: number
    neededForOrders: number
    suggestedQty: number
    relatedOrderIds: string[]
  }> = []

  // productMap only has products with stockMin > 0 — fetch remaining ones (stockMin = 0) separately
  const productMap = new Map(products.map((p) => [p.id, p]))
  const missingIds = [...shortByProduct.keys()].filter((id) => !productMap.has(id))
  if (missingIds.length > 0) {
    const extra = await prisma.product.findMany({
      where: { id: { in: missingIds } },
      include: {
        category: { select: { name: true } },
        productStocks: { where: { warehouseId: warehouse.id }, take: 1 },
      },
    })
    for (const p of extra) productMap.set(p.id, p)
  }

  for (const productId of allProductIds) {
    const p = productMap.get(productId)
    if (!p) continue
    const stock = p.productStocks[0]
    const availableQty = stock?.availableQty ?? 0
    const deficitFromMin = Math.max(0, p.stockMin - availableQty)
    const orderShort = shortByProduct.get(productId)
    const neededForOrders = orderShort?.needed ?? 0
    const suggestedQty = Math.max(deficitFromMin, neededForOrders)
    suggestions.push({
      productId,
      productName: p.name,
      productSku: p.sku,
      productImage: p.mainImage,
      category: p.category.name,
      availableQty,
      stockMin: p.stockMin,
      deficitFromMin,
      neededForOrders,
      suggestedQty,
      relatedOrderIds: orderShort?.orderIds ?? [],
    })
  }

  suggestions.sort((a, b) => b.suggestedQty - a.suggestedQty)

  return { suggestions, pendingOrders, warehouseId: warehouse.id }
}

// ─── Create purchase order ─────────────────────────────────────────────────────

interface PurchaseItemInput {
  productId: string
  quantity: number
  unitCost: number
}

interface CreatePurchaseOrderInput {
  supplierId: string
  items: PurchaseItemInput[]
  expectedAt?: string
  notes?: string
  linkedOrderIds?: string[]
  sendImmediately?: boolean
}

export async function createPurchaseOrder(
  input: CreatePurchaseOrderInput
): Promise<ActionResult<{ id: string; number: string }>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }
  if (!can(session.user.permissions, "compras", "create")) {
    return { success: false, error: "Sem permissão para criar pedidos de compra" }
  }

  if (!input.supplierId) return { success: false, error: "Fornecedor obrigatório" }
  if (!input.items?.length) return { success: false, error: "Adicione ao menos um item" }
  for (const item of input.items) {
    if (item.quantity <= 0) return { success: false, error: "Quantidade deve ser maior que zero" }
    if (item.unitCost < 0) return { success: false, error: "Custo unitário inválido" }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const settings = await tx.companySettings.findFirst()
      if (!settings) throw new Error("Configurações não encontradas")

      const updated = await tx.companySettings.update({
        where: { id: settings.id },
        data: { purchaseSequence: { increment: 1 } },
      })

      const number = formatPurchaseNumber(updated.purchaseSequence)
      const totalAmount = input.items.reduce((s, i) => s + i.quantity * i.unitCost, 0)

      const po = await tx.purchaseOrder.create({
        data: {
          number,
          sequentialNumber: updated.purchaseSequence,
          supplierId: input.supplierId,
          status: input.sendImmediately ? "ENVIADO" : "RASCUNHO",
          expectedAt: input.expectedAt ? new Date(input.expectedAt) : null,
          notes: input.notes ?? null,
          totalAmount,
          items: {
            create: input.items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              unitCost: i.unitCost,
              subtotal: i.quantity * i.unitCost,
              receivedQty: 0,
            })),
          },
          ...(input.linkedOrderIds?.length
            ? { salesOrders: { connect: input.linkedOrderIds.map((id) => ({ id })) } }
            : {}),
        },
      })

      return { id: po.id, number: po.number }
    })

    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entity: "PurchaseOrder",
      entityId: result.id,
      newData: { number: result.number, supplierId: input.supplierId },
    })

    revalidatePath("/compras")
    revalidatePath("/compras/sugeridas")
    return { success: true, data: result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao criar pedido de compra"
    return { success: false, error: msg }
  }
}

// ─── Update purchase order status ─────────────────────────────────────────────

const STATUS_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  RASCUNHO: ["ENVIADO", "CANCELADO"],
  ENVIADO: ["CONFIRMADO", "CANCELADO"],
  CONFIRMADO: ["RECEBIDO_PARCIAL", "RECEBIDO_TOTAL", "CANCELADO"],
  RECEBIDO_PARCIAL: ["RECEBIDO_TOTAL", "CANCELADO"],
  RECEBIDO_TOTAL: [],
  CANCELADO: [],
}

export async function updatePurchaseOrderStatus(
  id: string,
  status: PurchaseOrderStatus
): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }
  if (!can(session.user.permissions, "compras", "edit")) {
    return { success: false, error: "Sem permissão" }
  }

  try {
    const po = await prisma.purchaseOrder.findUnique({ where: { id } })
    if (!po) return { success: false, error: "Pedido de compra não encontrado" }

    if (!STATUS_TRANSITIONS[po.status].includes(status)) {
      return { success: false, error: `Não é possível alterar de ${po.status} para ${status}` }
    }

    await prisma.purchaseOrder.update({ where: { id }, data: { status } })

    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entity: "PurchaseOrder",
      entityId: id,
      oldData: { status: po.status },
      newData: { status },
    })

    revalidatePath("/compras")
    revalidatePath(`/compras/${id}`)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Erro ao atualizar status" }
  }
}

// ─── Receive items ─────────────────────────────────────────────────────────────

interface ReceiveItemInput {
  purchaseOrderItemId: string
  receivingQty: number
}

export async function receivePurchaseItems(
  purchaseOrderId: string,
  received: ReceiveItemInput[],
  payableDueDays = 28
): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }
  if (!can(session.user.permissions, "compras", "edit")) {
    return { success: false, error: "Sem permissão" }
  }

  const actuallyReceived = received.filter((r) => r.receivingQty > 0)
  if (!actuallyReceived.length) {
    return { success: false, error: "Informe ao menos uma quantidade recebida" }
  }

  try {
    const warehouse = await getOrCreateDefaultWarehouse()

    await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
        include: {
          items: { include: { product: true } },
          salesOrders: { select: { id: true, status: true, stockStatus: true } },
        },
      })
      if (!po) throw new Error("Pedido de compra não encontrado")

      if (po.status === "RECEBIDO_TOTAL" || po.status === "CANCELADO") {
        throw new Error("Este pedido não pode receber mais itens")
      }

      // Validate all entries before writing anything
      for (const entry of actuallyReceived) {
        const item = po.items.find((i) => i.id === entry.purchaseOrderItemId)
        if (!item) throw new Error(`Item ${entry.purchaseOrderItemId} não encontrado`)
        const remaining = item.quantity - item.receivedQty
        if (entry.receivingQty > remaining) {
          throw new Error(`Quantidade recebida (${entry.receivingQty}) excede o pendente (${remaining}) para ${item.product.name}`)
        }
      }

      // Compute total from already-loaded data — no extra query needed
      const totalReceivingAmount = actuallyReceived.reduce((s, entry) => {
        const item = po.items.find((i) => i.id === entry.purchaseOrderItemId)!
        return s + entry.receivingQty * Number(item.unitCost)
      }, 0)

      // Phase 1 (parallel): stock entry + item qty update per item — each touches a distinct product row
      await Promise.all(actuallyReceived.map(async (entry) => {
        const item = po.items.find((i) => i.id === entry.purchaseOrderItemId)!

        // Stock entry must complete before reading the updated avgCost
        await applyStockEntryInTx(tx, {
          productId: item.productId,
          warehouseId: warehouse.id,
          quantity: entry.receivingQty,
          unitCost: Number(item.unitCost),
          referenceType: "PurchaseOrder",
          referenceId: purchaseOrderId,
          userId: session.user.id,
          reason: `Recebimento PC ${po.number}`,
        })

        // These two are independent of each other — run in parallel
        const [updatedStock] = await Promise.all([
          tx.productStock.findUnique({
            where: { productId_warehouseId: { productId: item.productId, warehouseId: warehouse.id } },
          }),
          tx.purchaseOrderItem.update({
            where: { id: item.id },
            data: { receivedQty: { increment: entry.receivingQty } },
          }),
        ])

        if (updatedStock && Number(updatedStock.avgCost) > 0) {
          await tx.product.update({
            where: { id: item.productId },
            data: { costPrice: updatedStock.avgCost },
          })
        }
      }))

      // Determine new PO status using in-memory data + increments already applied above
      const allReceived = po.items.every((i) => {
        const entry = actuallyReceived.find((e) => e.purchaseOrderItemId === i.id)
        return i.receivedQty + (entry?.receivingQty ?? 0) >= i.quantity
      })
      const anyReceived = po.items.some((i) => {
        const entry = actuallyReceived.find((e) => e.purchaseOrderItemId === i.id)
        return i.receivedQty + (entry?.receivingQty ?? 0) > 0
      })
      const newPoStatus: PurchaseOrderStatus = allReceived
        ? "RECEBIDO_TOTAL"
        : anyReceived
        ? "RECEBIDO_PARCIAL"
        : po.status

      // Phase 2 (parallel): PO update + SO reservation supplements + AccountPayable
      await Promise.all([
        tx.purchaseOrder.update({ where: { id: purchaseOrderId }, data: { status: newPoStatus } }),

        ...po.salesOrders
          .filter((so) => so.stockStatus !== "OK")
          .map(async (so) => {
            if (so.status === "ENTREGUE") {
              // Order already delivered via override — settle the physical debt directly with SAIDA
              await fulfillStockDebtInTx(tx, so.id, warehouse.id, session.user.id, `Quitação de dívida PC ${po.number}`)
              await tx.salesOrder.update({ where: { id: so.id }, data: { stockStatus: "OK" } })
            } else {
              const newStockStatus = await refreshOrderReservations(tx, so.id)
              await tx.salesOrder.update({ where: { id: so.id }, data: { stockStatus: newStockStatus } })
            }
          }),

        totalReceivingAmount > 0
          ? tx.accountPayable.create({
              data: {
                purchaseOrderId,
                supplierId: po.supplierId,
                amount: totalReceivingAmount,
                dueDate: addDays(new Date(), payableDueDays),
                status: "PENDENTE",
                notes: `Recebimento PC ${po.number}`,
              },
            })
          : Promise.resolve(),
      ])
    }, { timeout: 15000 })

    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entity: "PurchaseOrder",
      entityId: purchaseOrderId,
      newData: { action: "RECEBIMENTO", items: actuallyReceived },
    })

    revalidatePath("/compras")
    revalidatePath(`/compras/${purchaseOrderId}`)
    revalidatePath("/pedidos")
    revalidatePath("/estoque")
    return { success: true, data: undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao registrar recebimento"
    return { success: false, error: msg }
  }
}

// ─── Read queries ──────────────────────────────────────────────────────────────

export async function getPurchaseOrders(filters?: {
  status?: PurchaseOrderStatus
  supplierId?: string
}) {
  return prisma.purchaseOrder.findMany({
    where: {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.supplierId ? { supplierId: filters.supplierId } : {}),
    },
    include: {
      supplier: { select: { id: true, tradeName: true, companyName: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getPurchaseOrderById(id: string) {
  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: {
        include: { product: { select: { id: true, sku: true, name: true, mainImage: true } } },
        orderBy: { createdAt: "asc" },
      },
      salesOrders: {
        select: {
          id: true,
          stockStatus: true,
          customer: { select: { companyName: true, tradeName: true, document: true } },
          proposal: { select: { number: true } },
        },
      },
      payables: { orderBy: { createdAt: "desc" } },
    },
  })
}
