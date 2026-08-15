"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"
import { proposalSchema, quickCustomerSchema } from "@/lib/validations/proposal"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/types"
import { can } from "@/lib/rbac"
import { addDays } from "date-fns"
import { Prisma, type ProposalStatus } from "@prisma/client"
import { createOrderReservations } from "@/actions/stock"

function formatProposalNumber(seq: number, date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0")
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const yy = String(date.getFullYear()).slice(-2)
  return `${seq}.${dd}${mm}.${yy}`
}

function effectiveCost(item: { costPrice: number; customCost?: number | null }): number {
  return item.customCost != null ? item.customCost : item.costPrice
}

export async function createProposal(
  formData: unknown
): Promise<ActionResult<{ id: string; number: string }>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }
  if (!can(session.user.permissions, "propostas", "create")) {
    return { success: false, error: "Sem permissão para criar propostas" }
  }

  const parsed = proposalSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const settings = await prisma.companySettings.findFirst()
    if (!settings) return { success: false, error: "Configurações da empresa não encontradas" }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.companySettings.update({
        where: { id: settings.id },
        data: { proposalSequence: { increment: 1 } },
      })

      const now = new Date()
      const seq = updated.proposalSequence
      const number = formatProposalNumber(seq, now)
      const { items, ...rest } = parsed.data

      const totalProducts = items.reduce((sum, item) => sum + item.subtotal, 0)
      const freight = rest.freight || 0
      const totalAmount = totalProducts + freight

      const estimatedMargin = items.reduce(
        (sum, item) => sum + (item.netPrice - effectiveCost(item)) * item.quantity,
        0
      )
      const estimatedMarginPct = totalProducts > 0
        ? (estimatedMargin / totalProducts) * 100
        : 0

      const proposal = await tx.salesProposal.create({
        data: {
          number,
          sequentialNumber: seq,
          customerId: rest.customerId,
          opportunityId: rest.opportunityId || null,
          userId: session.user.id,
          nature: rest.nature,
          validityDays: rest.validityDays,
          validityDate: addDays(now, rest.validityDays),
          paymentCondition: rest.paymentCondition || null,
          installments: rest.installments || null,
          installmentDueDates: rest.installmentDueDates || [],
          freight,
          totalProducts,
          totalAmount,
          estimatedMargin,
          estimatedMarginPct,
          minMarginPct: Number(updated.minMarginPct),
          notes: rest.notes || null,
          additionalInfo: rest.additionalInfo || null,
          items: {
            createMany: {
              data: items.map((item, idx) => ({
                productId: item.productId || null,
                isCustomItem: item.isCustomItem ?? false,
                customCost: item.customCost ?? null,
                customSpecs: item.customSpecs || null,
                position: idx,
                productName: item.productName,
                productSku: item.productSku,
                productImage: item.productImage || null,
                productDescription: item.productDescription || null,
                technicalSpecs: item.technicalSpecs
                  ? (item.technicalSpecs as Prisma.InputJsonValue)
                  : Prisma.JsonNull,
                listPrice: item.listPrice,
                costPrice: item.costPrice,
                ipiPct: item.ipiPct,
                discountPct: item.discountPct,
                netPrice: item.netPrice,
                quantity: item.quantity,
                subtotal: item.subtotal,
                estimatedMargin: item.estimatedMargin ?? null,
                estimatedMarginPct: item.estimatedMarginPct ?? null,
              })),
            },
          },
        },
      })

      return { proposal, number }
    })

    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entity: "SalesProposal",
      entityId: result.proposal.id,
      newData: { number: result.number },
    })

    revalidatePath("/propostas")
    return { success: true, data: { id: result.proposal.id, number: result.number } }
  } catch (err) {
    console.error(err)
    return { success: false, error: "Erro ao criar proposta" }
  }
}

export async function updateProposal(
  id: string,
  formData: unknown
): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }

  const parsed = proposalSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const proposal = await prisma.salesProposal.findUnique({ where: { id } })
    if (!proposal) return { success: false, error: "Proposta não encontrada" }
    if (proposal.frozenAt) return { success: false, error: "Proposta aprovada não pode ser editada" }
    if (!["RASCUNHO", "EM_NEGOCIACAO"].includes(proposal.status)) {
      return { success: false, error: "Apenas propostas em rascunho ou negociação podem ser editadas" }
    }

    const { items, ...rest } = parsed.data
    const totalProducts = items.reduce((sum, item) => sum + item.subtotal, 0)
    const freight = rest.freight || 0
    const totalAmount = totalProducts + freight
    const estimatedMarginPct = totalProducts > 0
      ? (items.reduce((sum, item) => sum + (item.netPrice - effectiveCost(item)) * item.quantity, 0) / totalProducts) * 100
      : 0

    await prisma.$transaction(async (tx) => {
      await tx.salesProposalItem.deleteMany({ where: { proposalId: id } })

      await tx.salesProposal.update({
        where: { id },
        data: {
          customerId: rest.customerId,
          opportunityId: rest.opportunityId || null,
          nature: rest.nature,
          validityDays: rest.validityDays,
          validityDate: addDays(new Date(), rest.validityDays),
          paymentCondition: rest.paymentCondition || null,
          installments: rest.installments || null,
          installmentDueDates: rest.installmentDueDates || [],
          freight,
          totalProducts,
          totalAmount,
          estimatedMarginPct,
          notes: rest.notes || null,
          additionalInfo: rest.additionalInfo || null,
          items: {
            createMany: {
              data: items.map((item, idx) => ({
                productId: item.productId || null,
                isCustomItem: item.isCustomItem ?? false,
                customCost: item.customCost ?? null,
                customSpecs: item.customSpecs || null,
                position: idx,
                productName: item.productName,
                productSku: item.productSku,
                productImage: item.productImage || null,
                productDescription: item.productDescription || null,
                technicalSpecs: item.technicalSpecs
                  ? (item.technicalSpecs as Prisma.InputJsonValue)
                  : Prisma.JsonNull,
                listPrice: item.listPrice,
                costPrice: item.costPrice,
                ipiPct: item.ipiPct,
                discountPct: item.discountPct,
                netPrice: item.netPrice,
                quantity: item.quantity,
                subtotal: item.subtotal,
                estimatedMargin: item.estimatedMargin ?? null,
                estimatedMarginPct: item.estimatedMarginPct ?? null,
              })),
            },
          },
        },
      })
    })

    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entity: "SalesProposal",
      entityId: id,
    })

    revalidatePath("/propostas")
    revalidatePath(`/propostas/${id}`)
    return { success: true, data: undefined }
  } catch (err) {
    console.error(err)
    return { success: false, error: "Erro ao atualizar proposta" }
  }
}

export async function approveProposal(id: string): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }
  if (!can(session.user.permissions, "propostas", "approve")) {
    return { success: false, error: "Apenas Gerentes e Administradores podem aprovar propostas" }
  }

  try {
    const proposal = await prisma.salesProposal.findUnique({
      where: { id },
      include: { items: true, customer: true },
    })
    if (!proposal) return { success: false, error: "Proposta não encontrada" }
    if (proposal.status === "APROVADA") return { success: false, error: "Proposta já foi aprovada" }
    if (proposal.status === "RECUSADA") return { success: false, error: "Proposta recusada não pode ser aprovada" }

    const minMargin = Number(proposal.minMarginPct)
    const currentMargin = Number(proposal.estimatedMarginPct ?? 0)
    if (currentMargin < minMargin) {
      if (!can(session.user.permissions, "propostas", "approve")) {
        return {
          success: false,
          error: `Margem (${currentMargin.toFixed(1)}%) abaixo do mínimo (${minMargin}%). Apenas Gerentes/Admin podem aprovar.`,
        }
      }
    }

    const wonStage = await prisma.pipelineStage.findFirst({ where: { isWon: true } })

    await prisma.$transaction(async (tx) => {
      const now = new Date()

      await tx.salesProposal.update({
        where: { id },
        data: {
          status: "APROVADA",
          frozenAt: now,
          approvedById: session.user.id,
          approvedAt: now,
        },
      })

      const order = await tx.salesOrder.create({
        data: {
          proposalId: id,
          customerId: proposal.customerId,
          userId: proposal.userId,
          totalAmount: proposal.totalAmount,
          items: {
            createMany: {
              data: proposal.items.map((item) => ({
                productId: item.productId ?? null,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.netPrice,
                subtotal: item.subtotal,
              })),
            },
          },
        },
      })

      const installments = proposal.installments || 1
      const amountPerInstallment = Number(proposal.totalAmount) / installments
      const receivables = Array.from({ length: installments }, (_, i) => {
        const storedDate = proposal.installmentDueDates?.[i]
        const dueDate = storedDate
          ? new Date(storedDate + "T12:00:00")
          : addDays(now, 30 * (i + 1))
        return {
          orderId: order.id,
          customerId: proposal.customerId,
          installment: i + 1,
          totalInstallments: installments,
          amount: amountPerInstallment,
          dueDate,
        }
      })
      await tx.accountReceivable.createMany({ data: receivables })

      // Only reserve stock for regular (non-custom) items with a product
      const stockableItems = proposal.items.filter((i) => !i.isCustomItem && i.productId)
      if (stockableItems.length > 0) {
        const stockResult = await createOrderReservations(
          tx,
          order.id,
          stockableItems.map((i) => ({ productId: i.productId!, quantity: i.quantity }))
        )
        if (stockResult !== "OK") {
          await tx.salesOrder.update({
            where: { id: order.id },
            data: { stockStatus: stockResult === "PARCIAL" ? "PARCIAL" : "INSUFICIENTE" },
          })
        }
      }

      await tx.activity.create({
        data: {
          type: "NOTA",
          title: `Proposta ${proposal.number} aprovada`,
          description: `Proposta no valor de R$ ${Number(proposal.totalAmount).toFixed(2)} aprovada por ${session.user.name}`,
          userId: session.user.id,
          opportunityId: proposal.opportunityId || undefined,
        },
      })

      if (proposal.opportunityId && wonStage) {
        await tx.opportunity.update({
          where: { id: proposal.opportunityId },
          data: { stageId: wonStage.id },
        })
      }
    })

    await createAuditLog({
      userId: session.user.id,
      action: "APPROVE",
      entity: "SalesProposal",
      entityId: id,
      newData: { approvedAt: new Date() },
    })

    revalidatePath("/propostas")
    revalidatePath(`/propostas/${id}`)
    return { success: true, data: undefined }
  } catch (err) {
    console.error(err)
    return { success: false, error: "Erro ao aprovar proposta" }
  }
}

export async function rejectProposal(
  id: string,
  reason: string
): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }

  try {
    const proposal = await prisma.salesProposal.findUnique({ where: { id } })
    if (!proposal) return { success: false, error: "Proposta não encontrada" }
    if (proposal.frozenAt) return { success: false, error: "Proposta aprovada não pode ser recusada" }

    await prisma.salesProposal.update({
      where: { id },
      data: {
        status: "RECUSADA",
        rejectedAt: new Date(),
        rejectionReason: reason || null,
      },
    })

    await createAuditLog({
      userId: session.user.id,
      action: "REJECT",
      entity: "SalesProposal",
      entityId: id,
      newData: { reason },
    })

    revalidatePath("/propostas")
    revalidatePath(`/propostas/${id}`)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Erro ao recusar proposta" }
  }
}

export async function sendProposal(id: string): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }

  try {
    const proposal = await prisma.salesProposal.findUnique({
      where: { id },
      include: { _count: { select: { items: true } } },
    })
    if (!proposal) return { success: false, error: "Proposta não encontrada" }
    if (proposal._count.items === 0) return { success: false, error: "Proposta sem itens" }

    await prisma.salesProposal.update({
      where: { id },
      data: {
        status: "ENVIADA",
        sentAt: new Date(),
      },
    })

    await createAuditLog({
      userId: session.user.id,
      action: "SEND",
      entity: "SalesProposal",
      entityId: id,
    })

    revalidatePath("/propostas")
    revalidatePath(`/propostas/${id}`)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Erro ao marcar proposta como enviada" }
  }
}

export async function duplicateProposal(id: string): Promise<ActionResult<{ id: string; number: string }>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }

  try {
    const source = await prisma.salesProposal.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!source) return { success: false, error: "Proposta não encontrada" }

    const settings = await prisma.companySettings.findFirst()
    if (!settings) return { success: false, error: "Configurações não encontradas" }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.companySettings.update({
        where: { id: settings.id },
        data: { proposalSequence: { increment: 1 } },
      })

      const now = new Date()
      const seq = updated.proposalSequence
      const number = formatProposalNumber(seq, now)

      const newProposal = await tx.salesProposal.create({
        data: {
          number,
          sequentialNumber: seq,
          customerId: source.customerId,
          opportunityId: source.opportunityId,
          userId: session.user.id,
          nature: source.nature,
          validityDays: source.validityDays,
          validityDate: addDays(now, source.validityDays),
          paymentCondition: source.paymentCondition,
          installments: source.installments,
          installmentDueDates: source.installmentDueDates,
          freight: source.freight,
          totalProducts: source.totalProducts,
          totalAmount: source.totalAmount,
          estimatedMargin: source.estimatedMargin,
          estimatedMarginPct: source.estimatedMarginPct,
          minMarginPct: source.minMarginPct,
          notes: source.notes,
          additionalInfo: source.additionalInfo,
          items: {
            createMany: {
              data: source.items.map((item) => ({
                productId: item.productId ?? null,
                isCustomItem: item.isCustomItem,
                customCost: item.customCost ?? null,
                customSpecs: item.customSpecs ?? null,
                position: item.position,
                productName: item.productName,
                productSku: item.productSku,
                productImage: item.productImage,
                productDescription: item.productDescription,
                technicalSpecs: item.technicalSpecs
                  ? (item.technicalSpecs as Prisma.InputJsonValue)
                  : Prisma.JsonNull,
                listPrice: item.listPrice,
                costPrice: item.costPrice,
                ipiPct: item.ipiPct,
                discountPct: item.discountPct,
                netPrice: item.netPrice,
                quantity: item.quantity,
                subtotal: item.subtotal,
                estimatedMargin: item.estimatedMargin,
                estimatedMarginPct: item.estimatedMarginPct,
              })),
            },
          },
        },
      })

      return { proposal: newProposal, number }
    })

    await createAuditLog({
      userId: session.user.id,
      action: "DUPLICATE",
      entity: "SalesProposal",
      entityId: result.proposal.id,
      newData: { duplicatedFrom: id, number: result.number },
    })

    revalidatePath("/propostas")
    return { success: true, data: { id: result.proposal.id, number: result.number } }
  } catch (err) {
    console.error(err)
    return { success: false, error: "Erro ao duplicar proposta" }
  }
}

export async function getProposals(filters?: {
  status?: string
  customerId?: string
  userId?: string
  from?: Date
  to?: Date
}) {
  return prisma.salesProposal.findMany({
    where: {
      deletedAt: null,
      ...(filters?.status ? { status: filters.status as ProposalStatus } : {}),
      ...(filters?.customerId ? { customerId: filters.customerId } : {}),
      ...(filters?.userId ? { userId: filters.userId } : {}),
      ...(filters?.from || filters?.to
        ? {
            createdAt: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    },
    include: {
      customer: { select: { id: true, companyName: true, tradeName: true, document: true } },
      seller: { select: { id: true, name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getProposalById(id: string) {
  return prisma.salesProposal.findUnique({
    where: { id, deletedAt: null },
    include: {
      customer: { include: { contacts: { where: { deletedAt: null } } } },
      seller: true,
      approvedBy: true,
      opportunity: true,
      items: { orderBy: { position: "asc" } },
      order: { include: { items: true, receivables: true } },
    },
  })
}

export async function createQuickCustomer(
  formData: unknown
): Promise<ActionResult<{ id: string; displayName: string }>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }

  const parsed = quickCustomerSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const exists = await prisma.customer.findFirst({
      where: { document: parsed.data.document.replace(/\D/g, "") },
    })
    if (exists) {
      const name = exists.companyName || exists.tradeName || exists.document
      return { success: true, data: { id: exists.id, displayName: name } }
    }

    const doc = parsed.data.document.replace(/\D/g, "")
    const customer = await prisma.customer.create({
      data: {
        type: parsed.data.type,
        companyName: parsed.data.companyName || null,
        tradeName: parsed.data.tradeName || null,
        document: doc,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
      },
    })

    revalidatePath("/clientes")
    const displayName = customer.companyName || customer.tradeName || customer.document
    return { success: true, data: { id: customer.id, displayName } }
  } catch {
    return { success: false, error: "Erro ao cadastrar cliente" }
  }
}

export async function getCustomersForSelect() {
  const customers = await prisma.customer.findMany({
    where: { deletedAt: null, isActive: true },
    select: {
      id: true,
      companyName: true,
      tradeName: true,
      document: true,
      phone: true,
      email: true,
      type: true,
    },
    orderBy: { companyName: "asc" },
  })

  return customers.map((c) => ({
    ...c,
    displayName: c.companyName || c.tradeName || c.document,
  }))
}
