"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/types"
import type { OrderStatus } from "@prisma/client"
import { fulfillOrderReservations } from "@/actions/stock"

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDENTE: ["CONFIRMADO", "CANCELADO"],
  CONFIRMADO: ["AGUARDANDO_EXPEDICAO", "CANCELADO"],
  AGUARDANDO_EXPEDICAO: ["ENTREGUE", "CANCELADO"],
  ENTREGUE: [],
  CANCELADO: [],
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  override?: boolean
): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }

  try {
    const order = await prisma.salesOrder.findUnique({ where: { id } })
    if (!order) return { success: false, error: "Pedido não encontrado" }

    const allowed = STATUS_TRANSITIONS[order.status]
    if (!allowed.includes(status)) {
      return { success: false, error: `Não é possível alterar de ${order.status} para ${status}` }
    }

    // Server-side guard: only ADMIN/GERENTE can force delivery with insufficient stock
    if (status === "ENTREGUE" && order.stockStatus !== "OK" && !override) {
      return { success: false, error: "Estoque insuficiente. Confirme a entrega explicitamente." }
    }
    if (status === "ENTREGUE" && order.stockStatus !== "OK" && override) {
      const role = session.user.roleName as string
      if (role !== "ADMIN" && role !== "GERENTE") {
        return { success: false, error: "Somente Gerente ou Admin podem confirmar entrega com estoque insuficiente." }
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.salesOrder.update({ where: { id }, data: { status } })

      if (status === "ENTREGUE") {
        await fulfillOrderReservations(tx, id, session.user.id)
      }

      if (status === "CANCELADO") {
        // Cancel active reservations without generating SAIDA movement
        const reservations = await tx.stockReservation.findMany({
          where: { orderId: id, status: "ATIVA" },
        })
        for (const res of reservations) {
          await tx.stockReservation.update({ where: { id: res.id }, data: { status: "CANCELADA" } })
          await tx.productStock.update({
            where: { productId_warehouseId: { productId: res.productId, warehouseId: res.warehouseId } },
            data: {
              reservedQty: { decrement: res.quantity },
              availableQty: { increment: res.quantity },
            },
          })
        }
      }
    })

    const newData: Record<string, unknown> = { status }
    if (status === "ENTREGUE" && override && order.stockStatus !== "OK") {
      newData.ALERTA_ESTOQUE_OVERRIDE = true
      newData.stockStatusNaEntrega = order.stockStatus
    }

    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entity: "SalesOrder",
      entityId: id,
      oldData: { status: order.status },
      newData,
    })

    revalidatePath("/pedidos")
    revalidatePath(`/pedidos/${id}`)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Erro ao atualizar status" }
  }
}

export async function updateOrderNotes(
  id: string,
  notes: string
): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }

  try {
    await prisma.salesOrder.update({ where: { id }, data: { notes: notes || null } })
    revalidatePath(`/pedidos/${id}`)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Erro ao salvar observações" }
  }
}

export async function getOrders(filters?: {
  status?: OrderStatus
  customerId?: string
  stockAlert?: boolean
}) {
  return prisma.salesOrder.findMany({
    where: {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.customerId ? { customerId: filters.customerId } : {}),
      ...(filters?.stockAlert ? { stockStatus: { not: "OK" } } : {}),
    },
    include: {
      customer: { select: { id: true, companyName: true, tradeName: true, document: true } },
      seller: { select: { id: true, name: true } },
      proposal: { select: { id: true, number: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getOrderById(id: string) {
  return prisma.salesOrder.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, companyName: true, tradeName: true, document: true, phone: true } },
      seller: { select: { id: true, name: true, email: true } },
      proposal: { select: { id: true, number: true, paymentCondition: true, installments: true, additionalInfo: true } },
      items: {
        include: { product: { select: { id: true, sku: true, name: true, mainImage: true } } },
        orderBy: { createdAt: "asc" },
      },
      receivables: { orderBy: { installment: "asc" } },
    },
  })
}
