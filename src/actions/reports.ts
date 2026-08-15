"use server"

import { prisma } from "@/lib/prisma"
import { getDRE } from "@/actions/financial"

// ── Comercial ─────────────────────────────────────────────────────────────────

export async function getComercialReport(from: Date, to: Date) {
  const dateFilter = { gte: from, lte: to }

  const [byStatusRaw, proposals, rejected, approvedForTime, inNegAgg] = await Promise.all([
    prisma.salesProposal.groupBy({
      by: ["status"],
      where: { createdAt: dateFilter, deletedAt: null },
      _count: { _all: true },
      _sum: { totalAmount: true },
    }),
    prisma.salesProposal.findMany({
      where: { createdAt: dateFilter, deletedAt: null },
      select: {
        status: true,
        totalAmount: true,
        userId: true,
        seller: { select: { name: true } },
      },
    }),
    prisma.salesProposal.findMany({
      where: { status: "RECUSADA", rejectedAt: dateFilter, deletedAt: null },
      select: { rejectionReason: true },
    }),
    prisma.salesProposal.findMany({
      where: { status: "APROVADA", approvedAt: dateFilter, deletedAt: null },
      select: { createdAt: true, approvedAt: true },
    }),
    prisma.salesProposal.aggregate({
      where: { status: { in: ["ENVIADA", "EM_NEGOCIACAO"] }, deletedAt: null },
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),
  ])

  const byStatus = byStatusRaw.map((s) => ({
    status: s.status,
    count: s._count._all,
    value: Number(s._sum.totalAmount ?? 0),
  }))

  const totalInPeriod = byStatus.reduce((sum, s) => sum + s.count, 0)
  const approvedCount = byStatus.find((s) => s.status === "APROVADA")?.count ?? 0
  const approvedValue = byStatus.find((s) => s.status === "APROVADA")?.value ?? 0
  const conversionRate = totalInPeriod > 0 ? (approvedCount / totalInPeriod) * 100 : 0
  const ticketMedio = approvedCount > 0 ? approvedValue / approvedCount : 0

  const sellerMap: Record<string, { name: string; total: number; aprovadas: number; valor: number }> = {}
  for (const p of proposals) {
    const key = p.userId
    if (!sellerMap[key]) sellerMap[key] = { name: p.seller?.name ?? "—", total: 0, aprovadas: 0, valor: 0 }
    sellerMap[key].total++
    if (p.status === "APROVADA") {
      sellerMap[key].aprovadas++
      sellerMap[key].valor += Number(p.totalAmount)
    }
  }
  const bySeller = Object.values(sellerMap)
    .map((s) => ({ ...s, conversionRate: s.total > 0 ? (s.aprovadas / s.total) * 100 : 0 }))
    .sort((a, b) => b.valor - a.valor)

  const reasonMap: Record<string, number> = {}
  for (const r of rejected) {
    const reason = (r.rejectionReason?.trim() || "Não informado").slice(0, 80)
    reasonMap[reason] = (reasonMap[reason] ?? 0) + 1
  }
  const rejectionReasons = Object.entries(reasonMap)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const avgApprovalDays =
    approvedForTime.length > 0
      ? approvedForTime.reduce((sum, p) => {
          const diff = (p.approvedAt!.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          return sum + diff
        }, 0) / approvedForTime.length
      : 0

  return {
    byStatus,
    bySeller,
    rejectionReasons,
    avgApprovalDays,
    conversionRate,
    ticketMedio,
    approvedValue,
    totalInPeriod,
    approvedCount,
    inNegotiation: {
      count: inNegAgg._count._all,
      value: Number(inNegAgg._sum.totalAmount ?? 0),
    },
  }
}

// ── Financeiro ────────────────────────────────────────────────────────────────

export async function getFinancialReport(from: Date, to: Date) {
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  const [paidReceivables, overdueItems, totalReceivableAgg, dreData] = await Promise.all([
    prisma.accountReceivable.findMany({
      where: {
        status: "PAGO",
        paidAt: { gte: from, lte: to },
        orderId: { not: null },
      },
      select: { amount: true, paidAt: true },
    }),
    prisma.accountReceivable.findMany({
      where: {
        status: { in: ["PENDENTE", "VENCIDO"] },
        dueDate: { lt: today },
      },
      select: {
        amount: true,
        dueDate: true,
        customer: { select: { tradeName: true, companyName: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 50,
    }),
    prisma.accountReceivable.aggregate({
      where: { status: { in: ["PENDENTE", "VENCIDO"] } },
      _sum: { amount: true },
    }),
    getDRE({
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    }),
  ])

  const monthlyMap: Record<string, number> = {}
  for (const r of paidReceivables) {
    if (!r.paidAt) continue
    const key = r.paidAt.toISOString().slice(0, 7)
    monthlyMap[key] = (monthlyMap[key] ?? 0) + Number(r.amount)
  }
  const monthlyRevenue = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, revenue]) => ({
      month,
      label: new Date(month + "-02").toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      revenue,
    }))

  const overdueTotal = overdueItems.reduce((sum, r) => sum + Number(r.amount), 0)
  const totalReceivableValue = Number(totalReceivableAgg._sum.amount ?? 0)

  return {
    monthlyRevenue,
    overdue: {
      total: overdueTotal,
      pct: totalReceivableValue > 0 ? (overdueTotal / totalReceivableValue) * 100 : 0,
      items: overdueItems.map((r) => ({
        customer: r.customer?.tradeName ?? r.customer?.companyName ?? "Cliente sem nome",
        amount: Number(r.amount),
        dueDate: r.dueDate,
      })),
    },
    margin: {
      grossRevenue: dreData.grossRevenue,
      cogsValue: dreData.cogsValue,
      grossMargin: dreData.grossMargin,
      grossMarginPct: dreData.grossMarginPct,
      netResult: dreData.netResult,
      netResultPct: dreData.netResultPct,
    },
  }
}

// ── Estoque ───────────────────────────────────────────────────────────────────

export async function getStockReport(from: Date, to: Date) {
  const dateFilter = { gte: from, lte: to }

  const [byTypeRaw, movements] = await Promise.all([
    prisma.stockMovement.groupBy({
      by: ["type"],
      where: { createdAt: dateFilter },
      _sum: { quantity: true, totalCost: true },
      _count: { _all: true },
    }),
    prisma.stockMovement.findMany({
      where: { createdAt: dateFilter },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { name: true } },
      },
    }),
  ])

  // Monthly series for chart
  const monthlyMap: Record<string, { entrada: number; saida: number }> = {}
  for (const m of movements) {
    const key = m.createdAt.toISOString().slice(0, 7)
    if (!monthlyMap[key]) monthlyMap[key] = { entrada: 0, saida: 0 }
    if (m.type === "ENTRADA") monthlyMap[key].entrada += m.quantity
    else if (m.type === "SAIDA") monthlyMap[key].saida += m.quantity
  }
  const monthlySeries = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, d]) => ({
      label: new Date(month + "-02").toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      entrada: d.entrada,
      saida: d.saida,
    }))

  return {
    byType: byTypeRaw.map((t) => ({
      type: t.type,
      count: t._count._all,
      quantity: t._sum.quantity ?? 0,
      totalCost: Number(t._sum.totalCost ?? 0),
    })),
    movements: movements.map((m) => ({
      id: m.id,
      type: m.type,
      quantity: m.quantity,
      unitCost: Number(m.unitCost ?? 0),
      totalCost: Number(m.totalCost ?? 0),
      reason: m.reason,
      referenceType: m.referenceType,
      productId: m.productId,
      createdAt: m.createdAt,
      userName: m.user?.name ?? "—",
    })),
    adjustments: movements
      .filter((m) => m.type === "AJUSTE")
      .map((m) => ({
        id: m.id,
        quantity: m.quantity,
        reason: m.reason,
        productId: m.productId,
        createdAt: m.createdAt,
        userName: m.user?.name ?? "—",
      })),
    monthlySeries,
  }
}

// ── Margem ────────────────────────────────────────────────────────────────────

export async function getMarginReport(from: Date, to: Date) {
  const items = await prisma.salesProposalItem.findMany({
    where: {
      proposal: {
        status: "APROVADA",
        approvedAt: { gte: from, lte: to },
        deletedAt: null,
      },
    },
    include: {
      proposal: {
        select: {
          id: true,
          number: true,
          totalAmount: true,
          estimatedMargin: true,
          estimatedMarginPct: true,
        },
      },
      product: {
        select: { category: { select: { name: true } } },
      },
    },
  })

  if (items.length === 0) {
    return { byProduct: [], byProposal: [], byCategory: [], discountImpact: [] }
  }

  const productMap: Record<
    string,
    { name: string; sku: string; qty: number; revenue: number; cost: number; margin: number; discountValue: number; isCustom: boolean }
  > = {}
  for (const item of items) {
    const key = item.productId ?? `avulso:${item.id}`
    if (!productMap[key]) {
      const effectiveCost = Number(item.customCost ?? item.costPrice)
      productMap[key] = { name: item.productName, sku: item.productSku, qty: 0, revenue: 0, cost: 0, margin: 0, discountValue: 0, isCustom: item.isCustomItem }
    }
    const qty = item.quantity
    const effectiveCost = Number(item.customCost ?? item.costPrice)
    productMap[key].qty += qty
    productMap[key].revenue += Number(item.netPrice) * qty
    productMap[key].cost += effectiveCost * qty
    productMap[key].margin += (Number(item.netPrice) - effectiveCost) * qty
    productMap[key].discountValue += (Number(item.listPrice) - Number(item.netPrice)) * qty
  }
  const byProduct = Object.entries(productMap)
    .map(([id, d]) => ({
      productId: id,
      name: d.name,
      sku: d.sku,
      qty: d.qty,
      revenue: d.revenue,
      cost: d.cost,
      margin: d.margin,
      marginPct: d.revenue > 0 ? (d.margin / d.revenue) * 100 : 0,
      discountValue: d.discountValue,
      isCustom: d.isCustom,
    }))
    .sort((a, b) => b.marginPct - a.marginPct)

  const proposalMap: Record<string, { number: string; totalAmount: number; estimatedMargin: number; estimatedMarginPct: number }> = {}
  for (const item of items) {
    const p = item.proposal
    if (!proposalMap[p.id]) {
      proposalMap[p.id] = {
        number: p.number,
        totalAmount: Number(p.totalAmount),
        estimatedMargin: Number(p.estimatedMargin ?? 0),
        estimatedMarginPct: Number(p.estimatedMarginPct ?? 0),
      }
    }
  }
  const byProposal = Object.values(proposalMap).sort((a, b) => b.estimatedMarginPct - a.estimatedMarginPct)

  const categoryMap: Record<string, { qty: number; revenue: number; margin: number }> = {}
  for (const item of items) {
    const cat = item.isCustomItem
      ? "Sob Medida / Avulso"
      : (item.product?.category?.name ?? "Sem categoria")
    if (!categoryMap[cat]) categoryMap[cat] = { qty: 0, revenue: 0, margin: 0 }
    const effectiveCost = Number(item.customCost ?? item.costPrice)
    categoryMap[cat].qty += item.quantity
    categoryMap[cat].revenue += Number(item.netPrice) * item.quantity
    categoryMap[cat].margin += (Number(item.netPrice) - effectiveCost) * item.quantity
  }
  const byCategory = Object.entries(categoryMap)
    .map(([name, d]) => ({
      name,
      qty: d.qty,
      revenue: d.revenue,
      margin: d.margin,
      marginPct: d.revenue > 0 ? (d.margin / d.revenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  const discountImpact = byProduct
    .filter((p) => p.discountValue > 0)
    .sort((a, b) => b.discountValue - a.discountValue)
    .slice(0, 20)
    .map((p) => ({
      name: p.name,
      sku: p.sku,
      discountValue: p.discountValue,
      marginWithoutDiscount: p.margin + p.discountValue,
      marginWithDiscount: p.margin,
    }))

  return { byProduct, byProposal, byCategory, discountImpact }
}

// ── Funil CRM ─────────────────────────────────────────────────────────────────

export async function getCRMReport(from: Date, to: Date) {
  const [byStageRaw, stages, history] = await Promise.all([
    prisma.opportunity.groupBy({
      by: ["stageId"],
      where: { deletedAt: null },
      _count: { _all: true },
      _sum: { value: true },
    }),
    prisma.pipelineStage.findMany({
      select: { id: true, name: true, color: true, order: true, isWon: true, isLost: true },
      orderBy: { order: "asc" },
    }),
    prisma.opportunityStageHistory.findMany({
      where: { createdAt: { gte: from, lte: to } },
      orderBy: [{ opportunityId: "asc" }, { createdAt: "asc" }],
      select: {
        opportunityId: true,
        fromStageId: true,
        toStageId: true,
        createdAt: true,
        opportunity: { select: { value: true } },
      },
    }),
  ])

  const stageMap = Object.fromEntries(stages.map((s) => [s.id, s]))
  const byStage = byStageRaw
    .map((s) => ({
      stageId: s.stageId,
      stageName: stageMap[s.stageId]?.name ?? "Desconhecido",
      stageColor: stageMap[s.stageId]?.color ?? "#6B7280",
      isWon: stageMap[s.stageId]?.isWon ?? false,
      isLost: stageMap[s.stageId]?.isLost ?? false,
      stageOrder: stageMap[s.stageId]?.order ?? 99,
      count: s._count._all,
      value: Number(s._sum.value ?? 0),
    }))
    .sort((a, b) => a.stageOrder - b.stageOrder)

  // Avg days per stage from history transitions
  const oppGroups: Record<string, { toStageId: string; createdAt: Date }[]> = {}
  for (const h of history) {
    if (!oppGroups[h.opportunityId]) oppGroups[h.opportunityId] = []
    oppGroups[h.opportunityId].push({ toStageId: h.toStageId, createdAt: h.createdAt })
  }

  const stageTimeAcc: Record<string, { totalDays: number; count: number }> = {}
  for (const records of Object.values(oppGroups)) {
    for (let i = 0; i < records.length - 1; i++) {
      const stageId = records[i].toStageId
      const days = (records[i + 1].createdAt.getTime() - records[i].createdAt.getTime()) / (1000 * 60 * 60 * 24)
      if (!stageTimeAcc[stageId]) stageTimeAcc[stageId] = { totalDays: 0, count: 0 }
      stageTimeAcc[stageId].totalDays += days
      stageTimeAcc[stageId].count++
    }
  }

  const stageAvgDays = stages.map((s) => ({
    stageId: s.id,
    stageName: s.name,
    avgDays: stageTimeAcc[s.id] ? stageTimeAcc[s.id].totalDays / stageTimeAcc[s.id].count : 0,
  }))

  // Conversion rates (moved out / entered) — count and value
  const convEntered: Record<string, number> = {}
  const convMoved: Record<string, number> = {}
  const convEnteredValue: Record<string, number> = {}
  const convMovedValue: Record<string, number> = {}
  for (const h of history) {
    const val = Number(h.opportunity?.value ?? 0)
    if (h.toStageId) {
      convEntered[h.toStageId] = (convEntered[h.toStageId] ?? 0) + 1
      convEnteredValue[h.toStageId] = (convEnteredValue[h.toStageId] ?? 0) + val
    }
    if (h.fromStageId) {
      convMoved[h.fromStageId] = (convMoved[h.fromStageId] ?? 0) + 1
      convMovedValue[h.fromStageId] = (convMovedValue[h.fromStageId] ?? 0) + val
    }
  }
  const conversionRates = stages.map((s) => ({
    stageId: s.id,
    stageName: s.name,
    entered: convEntered[s.id] ?? 0,
    moved: convMoved[s.id] ?? 0,
    conversionRate:
      (convEntered[s.id] ?? 0) > 0 ? ((convMoved[s.id] ?? 0) / (convEntered[s.id] ?? 1)) * 100 : 0,
    enteredValue: convEnteredValue[s.id] ?? 0,
    movedValue: convMovedValue[s.id] ?? 0,
    conversionRateValue:
      (convEnteredValue[s.id] ?? 0) > 0
        ? ((convMovedValue[s.id] ?? 0) / (convEnteredValue[s.id] ?? 1)) * 100
        : 0,
  }))

  return { byStage, stageAvgDays, conversionRates }
}
