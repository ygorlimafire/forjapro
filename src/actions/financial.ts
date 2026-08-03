"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"
import { revalidatePath } from "next/cache"
import { can } from "@/lib/rbac"
import { z } from "zod"
import type { ActionResult } from "@/types"
import type { ReceivableStatus, PayableStatus, Prisma } from "@prisma/client"
import { randomUUID } from "crypto"

// ─── Validation schemas ───────────────────────────────────────────────────────

const markPaidSchema = z.object({
  paidAt: z.string().min(1, "Data de pagamento obrigatória"),
  proofUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
  bankAccountId: z.string().optional(),
})

const markReceivedSchema = markPaidSchema.extend({
  paymentMethod: z.string().optional(),
})

const createReceivableSchema = z.object({
  description: z.string().min(1, "Descrição obrigatória"),
  amount: z.number().positive("Valor deve ser positivo"),
  dueDate: z.string().min(1, "Data de vencimento obrigatória"),
  notes: z.string().optional(),
})

const createPayableSchema = z.object({
  description: z.string().optional(),
  amount: z.number().positive("Valor deve ser positivo"),
  dueDate: z.string().min(1, "Data de vencimento obrigatória"),
  dueDates: z.array(z.string().min(1)).optional(),
  category: z.string().optional(),
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
  notes: z.string().optional(),
  installments: z.coerce.number().int().min(1).max(60).default(1),
  isRecurring: z.boolean().default(false),
  costCenter: z.enum(["COMERCIAL", "ADMINISTRATIVO", "OPERACIONAL"]).optional(),
  attachmentUrl: z.string().url().optional().or(z.literal("")).transform(v => v === "" ? undefined : v),
})

// ─── Receivables ──────────────────────────────────────────────────────────────

export async function getReceivables(filters?: {
  status?: ReceivableStatus | "VENCIDO"
  customerId?: string
  from?: string
  to?: string
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const where: Prisma.AccountReceivableWhereInput = {}

  if (filters?.customerId) where.customerId = filters.customerId

  if (filters?.from || filters?.to) {
    where.dueDate = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(filters.to + "T23:59:59") } : {}),
    }
  }

  if (filters?.status === "VENCIDO") {
    where.status = "PENDENTE"
    where.dueDate = { ...((where.dueDate as Prisma.DateTimeFilter) ?? {}), lt: today }
  } else if (filters?.status) {
    where.status = filters.status
  }

  const rows = await prisma.accountReceivable.findMany({
    where,
    include: {
      customer: { select: { id: true, companyName: true, tradeName: true, document: true } },
      order: {
        select: {
          id: true,
          proposal: { select: { number: true } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  })
  return rows.map((r) => ({
    ...r,
    amount: Number(r.amount),
    discountPct: r.discountPct != null ? Number(r.discountPct) : null,
    lateFeePerDay: r.lateFeePerDay != null ? Number(r.lateFeePerDay) : null,
    originalAmount: r.originalAmount != null ? Number(r.originalAmount) : null,
  }))
}

export async function markReceivableAsPaid(
  id: string,
  data: unknown
): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }
  if (!can(session.user.permissions, "financeiro", "edit")) {
    return { success: false, error: "Sem permissão" }
  }

  const parsed = markReceivedSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const rec = await prisma.accountReceivable.findUnique({ where: { id } })
  if (!rec) return { success: false, error: "Conta não encontrada" }
  if (rec.status === "PAGO") return { success: false, error: "Conta já está paga" }
  if (rec.status === "CANCELADO") return { success: false, error: "Conta cancelada" }

  try {
    await prisma.accountReceivable.update({
      where: { id },
      data: {
        status: "PAGO",
        paidAt: new Date(parsed.data.paidAt + "T12:00:00"),
        paymentMethod: parsed.data.paymentMethod || null,
        bankAccountId: parsed.data.bankAccountId || null,
        proofUrl: parsed.data.proofUrl || null,
        notes: parsed.data.notes || rec.notes || null,
      },
    })

    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entity: "AccountReceivable",
      entityId: id,
      oldData: { status: rec.status },
      newData: { status: "PAGO", paidAt: parsed.data.paidAt, paymentMethod: parsed.data.paymentMethod },
    })

    revalidatePath("/financeiro")
    return { success: true, data: undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

// ─── Payables ─────────────────────────────────────────────────────────────────

export async function getPayables(filters?: {
  status?: PayableStatus | "VENCIDO"
  supplierId?: string
  from?: string
  to?: string
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const where: Prisma.AccountPayableWhereInput = {}

  if (filters?.supplierId) where.supplierId = filters.supplierId

  if (filters?.from || filters?.to) {
    where.dueDate = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(filters.to + "T23:59:59") } : {}),
    }
  }

  if (filters?.status === "VENCIDO") {
    where.status = "PENDENTE"
    where.dueDate = { ...((where.dueDate as Prisma.DateTimeFilter) ?? {}), lt: today }
  } else if (filters?.status) {
    where.status = filters.status
  }

  const rows = await prisma.accountPayable.findMany({
    where,
    include: {
      supplier: { select: { id: true, companyName: true, tradeName: true } },
      purchaseOrder: { select: { id: true, number: true } },
      expenseCategory: { select: { id: true, name: true, color: true } },
    },
    orderBy: { dueDate: "asc" },
  })
  return rows.map((r) => ({ ...r, amount: Number(r.amount) }))
}

export async function getExpenseCategories() {
  return prisma.expenseCategory.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  })
}

export async function markPayableAsPaid(
  id: string,
  data: unknown
): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }
  if (!can(session.user.permissions, "financeiro", "edit")) {
    return { success: false, error: "Sem permissão" }
  }

  const parsed = markPaidSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const payable = await prisma.accountPayable.findUnique({ where: { id } })
  if (!payable) return { success: false, error: "Conta não encontrada" }
  if (payable.status === "PAGO") return { success: false, error: "Conta já está paga" }
  if (payable.status === "CANCELADO") return { success: false, error: "Conta cancelada" }

  try {
    await prisma.accountPayable.update({
      where: { id },
      data: {
        status: "PAGO",
        paidAt: new Date(parsed.data.paidAt + "T12:00:00"),
        bankAccountId: parsed.data.bankAccountId || null,
        proofUrl: parsed.data.proofUrl || null,
        notes: parsed.data.notes || payable.notes || null,
      },
    })

    // Auto-generate next recurring payable
    if (payable.isRecurring) {
      const nextDue = new Date(payable.dueDate)
      nextDue.setMonth(nextDue.getMonth() + 1)
      await prisma.accountPayable.create({
        data: {
          description: payable.description,
          amount: payable.amount,
          dueDate: nextDue,
          category: payable.category,
          categoryId: payable.categoryId,
          supplierId: payable.supplierId,
          notes: payable.notes,
          costCenter: payable.costCenter,
          isRecurring: true,
        },
      })
    }

    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entity: "AccountPayable",
      entityId: id,
      oldData: { status: payable.status },
      newData: { status: "PAGO", paidAt: parsed.data.paidAt },
    })

    revalidatePath("/financeiro")
    return { success: true, data: undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export async function updatePayableCategory(
  id: string,
  category: string
): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }
  if (!can(session.user.permissions, "financeiro", "edit")) {
    return { success: false, error: "Sem permissão" }
  }
  try {
    await prisma.accountPayable.update({ where: { id }, data: { category } })
    revalidatePath("/financeiro")
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Erro ao atualizar categoria" }
  }
}

export async function updatePayableExpenseCategory(id: string, categoryId: string): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }
  if (!can(session.user.permissions, "financeiro", "edit")) {
    return { success: false, error: "Sem permissão" }
  }
  try {
    await prisma.accountPayable.update({ where: { id }, data: { categoryId } })
    revalidatePath("/financeiro")
    return { success: true, data: undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

// ─── Cash flow summary ────────────────────────────────────────────────────────

export async function getCashFlowSummary() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const next7 = new Date(today)
  next7.setDate(today.getDate() + 7)

  const next30 = new Date(today)
  next30.setDate(today.getDate() + 30)

  const [receivables, payables] = await Promise.all([
    prisma.accountReceivable.findMany({
      where: { status: { not: "CANCELADO" } },
      select: { amount: true, dueDate: true, status: true, paidAt: true },
    }),
    prisma.accountPayable.findMany({
      where: { status: { not: "CANCELADO" } },
      select: { amount: true, dueDate: true, status: true, paidAt: true },
    }),
  ])

  // Realized
  const realizedIn = receivables
    .filter((r) => r.status === "PAGO")
    .reduce((s, r) => s + Number(r.amount), 0)
  const realizedOut = payables
    .filter((p) => p.status === "PAGO")
    .reduce((s, p) => s + Number(p.amount), 0)

  // Forecast (PENDENTE)
  const forecastIn = receivables
    .filter((r) => r.status === "PENDENTE")
    .reduce((s, r) => s + Number(r.amount), 0)
  const forecastOut = payables
    .filter((p) => p.status === "PENDENTE")
    .reduce((s, p) => s + Number(p.amount), 0)

  // Overdue
  const overdueIn = receivables
    .filter((r) => r.status === "PENDENTE" && new Date(r.dueDate) < today)
    .reduce((s, r) => s + Number(r.amount), 0)
  const overdueOut = payables
    .filter((p) => p.status === "PENDENTE" && new Date(p.dueDate) < today)
    .reduce((s, p) => s + Number(p.amount), 0)

  // Due in 7 days
  const due7In = receivables
    .filter((r) => r.status === "PENDENTE" && new Date(r.dueDate) >= today && new Date(r.dueDate) <= next7)
    .reduce((s, r) => s + Number(r.amount), 0)
  const due7Out = payables
    .filter((p) => p.status === "PENDENTE" && new Date(p.dueDate) >= today && new Date(p.dueDate) <= next7)
    .reduce((s, p) => s + Number(p.amount), 0)

  // Due in 30 days
  const due30In = receivables
    .filter((r) => r.status === "PENDENTE" && new Date(r.dueDate) >= today && new Date(r.dueDate) <= next30)
    .reduce((s, r) => s + Number(r.amount), 0)
  const due30Out = payables
    .filter((p) => p.status === "PENDENTE" && new Date(p.dueDate) >= today && new Date(p.dueDate) <= next30)
    .reduce((s, p) => s + Number(p.amount), 0)

  // Monthly series for chart (last 6 months + next 3)
  const seriesMap = new Map<string, { in: number; out: number; realizedIn: number; realizedOut: number }>()
  const getKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`

  const startMonth = new Date(today)
  startMonth.setMonth(startMonth.getMonth() - 5)
  startMonth.setDate(1)

  const endMonth = new Date(today)
  endMonth.setMonth(endMonth.getMonth() + 3)

  // Initialize all months in range
  const cur = new Date(startMonth)
  while (cur <= endMonth) {
    seriesMap.set(getKey(cur), { in: 0, out: 0, realizedIn: 0, realizedOut: 0 })
    cur.setMonth(cur.getMonth() + 1)
  }

  for (const r of receivables) {
    const key = getKey(new Date(r.dueDate))
    const entry = seriesMap.get(key)
    if (!entry) continue
    if (r.status === "PAGO") entry.realizedIn += Number(r.amount)
    else entry.in += Number(r.amount)
  }
  for (const p of payables) {
    const key = getKey(new Date(p.dueDate))
    const entry = seriesMap.get(key)
    if (!entry) continue
    if (p.status === "PAGO") entry.realizedOut += Number(p.amount)
    else entry.out += Number(p.amount)
  }

  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  const monthlySeries = [...seriesMap.entries()].map(([key, v]) => {
    const [year, month] = key.split("-")
    return {
      month: `${monthNames[parseInt(month) - 1]}/${year.slice(2)}`,
      entradas: v.in + v.realizedIn,
      saidas: v.out + v.realizedOut,
      saldo: (v.in + v.realizedIn) - (v.out + v.realizedOut),
    }
  })

  return {
    realizedIn,
    realizedOut,
    realizedBalance: realizedIn - realizedOut,
    forecastIn,
    forecastOut,
    forecastBalance: (realizedIn + forecastIn) - (realizedOut + forecastOut),
    overdueIn,
    overdueOut,
    due7In,
    due7Out,
    due30In,
    due30Out,
    monthlySeries,
  }
}

// ─── Manual account creation ──────────────────────────────────────────────────

export async function createReceivable(data: unknown): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }
  if (!can(session.user.permissions, "financeiro", "edit")) {
    return { success: false, error: "Sem permissão" }
  }

  const parsed = createReceivableSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  try {
    await prisma.accountReceivable.create({
      data: {
        description: parsed.data.description,
        amount: parsed.data.amount,
        dueDate: new Date(parsed.data.dueDate + "T12:00:00"),
        notes: parsed.data.notes || null,
      },
    })
    revalidatePath("/financeiro")
    return { success: true, data: undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export async function renegotiateReceivable(
  id: string,
  data: { newDueDate: string; newAmount?: number; discountPct?: number; lateFeePerDay?: number; notes?: string }
): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }
  if (!can(session.user.permissions, "financeiro", "edit")) {
    return { success: false, error: "Sem permissão" }
  }

  const rec = await prisma.accountReceivable.findUnique({ where: { id } })
  if (!rec) return { success: false, error: "Conta não encontrada" }
  if (rec.status !== "PENDENTE") return { success: false, error: "Apenas contas pendentes podem ser renegociadas" }

  const original = {
    dueDate: rec.dueDate,
    amount: rec.amount,
    discountPct: rec.discountPct,
    lateFeePerDay: rec.lateFeePerDay,
  }

  try {
    await prisma.accountReceivable.update({
      where: { id },
      data: {
        dueDate: new Date(data.newDueDate + "T12:00:00"),
        amount: data.newAmount ?? rec.amount,
        discountPct: data.discountPct ?? null,
        lateFeePerDay: data.lateFeePerDay ?? null,
        originalDueDate: rec.originalDueDate ?? rec.dueDate,
        originalAmount: rec.originalAmount ?? rec.amount,
        notes: data.notes ? `${rec.notes ? rec.notes + "\n" : ""}Renegociado: ${data.notes}` : rec.notes,
      },
    })

    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entity: "AccountReceivable",
      entityId: id,
      oldData: original,
      newData: { dueDate: data.newDueDate, amount: data.newAmount, discountPct: data.discountPct, lateFeePerDay: data.lateFeePerDay },
    })

    revalidatePath("/financeiro")
    return { success: true, data: undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export async function createPayable(data: unknown): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }
  if (!can(session.user.permissions, "financeiro", "edit")) {
    return { success: false, error: "Sem permissão" }
  }

  const parsed = createPayableSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" }

  const { installments, isRecurring, categoryId, supplierId, costCenter, attachmentUrl, dueDates, ...rest } = parsed.data
  const baseDate = new Date(rest.dueDate + "T12:00:00")

  try {
    if (installments > 1) {
      const groupId = randomUUID()
      await prisma.accountPayable.createMany({
        data: Array.from({ length: installments }, (_, i) => {
          // Use explicitly provided date if available, else fall back to +30 days
          let d: Date
          if (dueDates && dueDates[i]) {
            d = new Date(dueDates[i] + "T12:00:00")
          } else {
            d = new Date(baseDate)
            d.setMonth(d.getMonth() + i)
          }
          return {
            description: rest.description || null,
            amount: rest.amount,
            dueDate: d,
            category: rest.category || null,
            categoryId: categoryId || null,
            supplierId: supplierId || null,
            notes: rest.notes || null,
            costCenter: costCenter ?? null,
            attachmentUrl: attachmentUrl || null,
            installmentGroupId: groupId,
            installment: i + 1,
            totalInstallments: installments,
            isRecurring: false,
          }
        }),
      })
    } else {
      await prisma.accountPayable.create({
        data: {
          description: rest.description || null,
          amount: rest.amount,
          dueDate: baseDate,
          category: rest.category || null,
          categoryId: categoryId || null,
          supplierId: supplierId || null,
          notes: rest.notes || null,
          costCenter: costCenter ?? null,
          attachmentUrl: attachmentUrl || null,
          isRecurring,
          installment: 1,
          totalInstallments: 1,
        },
      })
    }
    revalidatePath("/financeiro")
    return { success: true, data: undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

// ─── Cash flow transactions list ─────────────────────────────────────────────

export async function getCashFlowTransactions(filters?: { from?: string; to?: string }) {
  const where: { paidAt?: { gte?: Date; lte?: Date } } = {}
  if (filters?.from || filters?.to) {
    where.paidAt = {
      ...(filters?.from ? { gte: new Date(filters.from + "T00:00:00") } : {}),
      ...(filters?.to ? { lte: new Date(filters.to + "T23:59:59") } : {}),
    }
  }

  const [receivables, payables] = await Promise.all([
    prisma.accountReceivable.findMany({
      where: { status: "PAGO", ...where },
      select: {
        id: true,
        amount: true,
        paidAt: true,
        description: true,
        notes: true,
        customer: { select: { companyName: true, tradeName: true, document: true } },
        order: { select: { proposal: { select: { number: true } } } },
        bankAccount: { select: { name: true } },
      },
      orderBy: { paidAt: "asc" },
    }),
    prisma.accountPayable.findMany({
      where: { status: "PAGO", ...where },
      select: {
        id: true,
        amount: true,
        paidAt: true,
        description: true,
        category: true,
        notes: true,
        supplier: { select: { companyName: true, tradeName: true } },
        purchaseOrder: { select: { number: true } },
        bankAccount: { select: { name: true } },
      },
      orderBy: { paidAt: "asc" },
    }),
  ])

  type TxEntry = {
    id: string
    date: Date
    description: string
    type: "entrada" | "saida"
    amount: number
    bankAccount: string | null
    balance?: number
  }

  const entries: TxEntry[] = [
    ...receivables.map((r) => ({
      id: r.id,
      date: r.paidAt!,
      description: r.description
        ?? r.customer?.companyName ?? r.customer?.tradeName ?? r.customer?.document
        ?? r.order?.proposal?.number ?? "Recebimento",
      type: "entrada" as const,
      amount: Number(r.amount),
      bankAccount: r.bankAccount?.name ?? null,
    })),
    ...payables.map((p) => ({
      id: p.id,
      date: p.paidAt!,
      description: p.description
        ?? p.supplier?.tradeName ?? p.supplier?.companyName
        ?? p.purchaseOrder?.number ?? p.category ?? "Pagamento",
      type: "saida" as const,
      amount: Number(p.amount),
      bankAccount: p.bankAccount?.name ?? null,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

  // Running balance
  let balance = 0
  for (const e of entries) {
    balance += e.type === "entrada" ? e.amount : -e.amount
    e.balance = balance
  }

  return entries
}

// ─── DRE ─────────────────────────────────────────────────────────────────────

export async function getDRE(filters?: { from?: string; to?: string }) {
  const dateFilter = {
    ...(filters?.from ? { gte: new Date(filters.from + "T00:00:00") } : {}),
    ...(filters?.to ? { lte: new Date(filters.to + "T23:59:59") } : {}),
  }

  const hasDateFilter = Object.keys(dateFilter).length > 0

  // Receita bruta: receivables recebidas no período (por paidAt)
  const paidReceivables = await prisma.accountReceivable.findMany({
    where: {
      status: "PAGO",
      ...(hasDateFilter ? { paidAt: dateFilter } : {}),
      orderId: { not: null },
    },
    select: { amount: true },
  })
  const grossRevenue = paidReceivables.reduce((s, r) => s + Number(r.amount), 0)

  // CMV: custo dos produtos vendidos (SAIDA movements linked to ENTREGUE orders in period)
  const cogs = await prisma.stockMovement.aggregate({
    where: {
      type: "SAIDA",
      ...(hasDateFilter ? { createdAt: dateFilter } : {}),
    },
    _sum: { totalCost: true },
  })
  const cogsValue = Number(cogs._sum.totalCost ?? 0)

  // Despesas: payables pagas no período, agrupadas por categoria
  const paidPayables = await prisma.accountPayable.findMany({
    where: {
      status: "PAGO",
      ...(hasDateFilter ? { paidAt: dateFilter } : {}),
    },
    select: { amount: true, category: true },
  })

  const expensesByCategory: Record<string, number> = {}
  let totalExpenses = 0
  for (const p of paidPayables) {
    const cat = p.category || "Outros"
    expensesByCategory[cat] = (expensesByCategory[cat] ?? 0) + Number(p.amount)
    totalExpenses += Number(p.amount)
  }

  const grossMargin = grossRevenue - cogsValue
  const netResult = grossMargin - totalExpenses

  return {
    grossRevenue,
    cogsValue,
    grossMargin,
    grossMarginPct: grossRevenue > 0 ? (grossMargin / grossRevenue) * 100 : 0,
    expensesByCategory,
    totalExpenses,
    netResult,
    netResultPct: grossRevenue > 0 ? (netResult / grossRevenue) * 100 : 0,
  }
}

// ─── Financial dashboard data ─────────────────────────────────────────────────

export async function getFinancialDashboard() {
  const now = new Date()
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  // Last 6 months range
  const sixMonthsAgo = new Date(now)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0, 0, 0, 0)

  const [payablesPaid, receivablesPaid, pendingPayables] = await Promise.all([
    prisma.accountPayable.findMany({
      where: { status: "PAGO", paidAt: { gte: sixMonthsAgo } },
      select: {
        amount: true,
        paidAt: true,
        categoryId: true,
        expenseCategory: { select: { name: true, color: true } },
      },
    }),
    prisma.accountReceivable.findMany({
      where: { status: "PAGO", paidAt: { gte: sixMonthsAgo } },
      select: { amount: true, paidAt: true },
    }),
    prisma.accountPayable.findMany({
      where: { status: "PENDENTE" },
      select: { id: true, amount: true, dueDate: true, description: true, supplier: { select: { tradeName: true, companyName: true } }, expenseCategory: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 20,
    }),
  ])

  // Month keys for last 6 months
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  const months: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now)
    d.setMonth(d.getMonth() - i)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
  }

  const monthMap = new Map<string, { revenue: number; expenses: number }>(
    months.map((m) => [m, { revenue: 0, expenses: 0 }])
  )

  for (const r of receivablesPaid) {
    if (!r.paidAt) continue
    const key = `${r.paidAt.getFullYear()}-${String(r.paidAt.getMonth() + 1).padStart(2, "0")}`
    const e = monthMap.get(key)
    if (e) e.revenue += Number(r.amount)
  }
  for (const p of payablesPaid) {
    if (!p.paidAt) continue
    const key = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, "0")}`
    const e = monthMap.get(key)
    if (e) e.expenses += Number(p.amount)
  }

  const monthlyComparison = months.map((key) => {
    const [year, month] = key.split("-")
    const v = monthMap.get(key)!
    return {
      month: `${monthNames[parseInt(month) - 1]}/${year.slice(2)}`,
      revenue: v.revenue,
      expenses: v.expenses,
      result: v.revenue - v.expenses,
    }
  })

  // Expenses by category (pie) — current month
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const categoryMap = new Map<string, { name: string; color: string; total: number }>()
  for (const p of payablesPaid) {
    if (!p.paidAt) continue
    const key = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, "0")}`
    if (key !== currentMonthKey) continue
    const catName = p.expenseCategory?.name ?? "Sem categoria"
    const catColor = p.expenseCategory?.color ?? "#6B7280"
    const catKey = catName
    const entry = categoryMap.get(catKey) ?? { name: catName, color: catColor, total: 0 }
    entry.total += Number(p.amount)
    categoryMap.set(catKey, entry)
  }
  const expensesByCategory = [...categoryMap.values()]
    .sort((a, b) => b.total - a.total)

  // Top 5 pending payables by due date
  const urgentPayables = pendingPayables
    .filter((p) => new Date(p.dueDate) <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000))
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      dueDate: p.dueDate,
      label: p.supplier?.tradeName ?? p.supplier?.companyName ?? p.description ?? p.expenseCategory?.name ?? "Conta a pagar",
      isOverdue: new Date(p.dueDate) < today,
    }))

  // Top 5 expense categories (all 6 months)
  const top5Map = new Map<string, { name: string; color: string; total: number }>()
  for (const p of payablesPaid) {
    const catName = p.expenseCategory?.name ?? "Sem categoria"
    const catColor = p.expenseCategory?.color ?? "#6B7280"
    const entry = top5Map.get(catName) ?? { name: catName, color: catColor, total: 0 }
    entry.total += Number(p.amount)
    top5Map.set(catName, entry)
  }
  const top5Expenses = [...top5Map.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  return {
    monthlyComparison,
    expensesByCategory,
    urgentPayables,
    top5Expenses,
  }
}

// ─── Expense category management ─────────────────────────────────────────────

export async function createExpenseCategory(data: { name: string; type: "FIXA" | "VARIAVEL"; color: string }): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user || !can(session.user.permissions, "configuracoes", "edit")) {
    return { success: false, error: "Sem permissão" }
  }
  try {
    await prisma.expenseCategory.create({ data })
    revalidatePath("/configuracoes")
    revalidatePath("/financeiro")
    return { success: true, data: undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export async function updateExpenseCategory(id: string, data: { name: string; type: "FIXA" | "VARIAVEL"; color: string }): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user || !can(session.user.permissions, "configuracoes", "edit")) {
    return { success: false, error: "Sem permissão" }
  }
  try {
    await prisma.expenseCategory.update({ where: { id }, data })
    revalidatePath("/configuracoes")
    revalidatePath("/financeiro")
    return { success: true, data: undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export async function toggleExpenseCategory(id: string, isActive: boolean): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user || !can(session.user.permissions, "configuracoes", "edit")) {
    return { success: false, error: "Sem permissão" }
  }
  try {
    await prisma.expenseCategory.update({ where: { id }, data: { isActive } })
    revalidatePath("/configuracoes")
    return { success: true, data: undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}
