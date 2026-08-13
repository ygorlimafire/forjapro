import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Metadata } from "next"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { getStockSummary } from "@/actions/stock"
import type { OrderStatus } from "@prisma/client"

export const metadata: Metadata = { title: "Dashboard" }

async function getDashboardData() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const [
    totalCustomers,
    newCustomersThisMonth,
    totalOpportunities,
    opportunitiesByStage,
    recentActivities,
    stockSummary,
    proposalsTotalThisMonth,
    proposalsApproved,
    ordersAguardando,
    revenueThisMonth,
    receivablesTotal,
    payablesTotal,
    avgMargin,
    revenueHistory,
  ] = await Promise.all([
    prisma.customer.count({ where: { deletedAt: null } }),
    prisma.customer.count({ where: { createdAt: { gte: startOfMonth }, deletedAt: null } }),
    prisma.opportunity.count({ where: { deletedAt: null } }),
    prisma.pipelineStage.findMany({
      include: { _count: { select: { opportunities: { where: { deletedAt: null } } } } },
      orderBy: { order: "asc" },
    }),
    prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { user: { select: { name: true } } },
    }),
    getStockSummary().catch(() => ({ totalValue: 0, lowStock: 0, zeroStock: 0 })),
    prisma.salesProposal.count({
      where: { createdAt: { gte: startOfMonth }, deletedAt: null },
    }),
    prisma.salesProposal.count({
      where: { approvedAt: { gte: startOfMonth }, status: "APROVADA", deletedAt: null },
    }),
    prisma.salesOrder.count({
      where: { status: "AGUARDANDO_EXPEDICAO" as OrderStatus },
    }),
    prisma.accountReceivable.aggregate({
      where: { status: "PAGO", paidAt: { gte: startOfMonth }, orderId: { not: null } },
      _sum: { amount: true },
    }),
    prisma.accountReceivable.aggregate({
      where: { status: { in: ["PENDENTE", "VENCIDO"] } },
      _sum: { amount: true },
    }),
    prisma.accountPayable.aggregate({
      where: { status: { in: ["PENDENTE", "VENCIDO"] } },
      _sum: { amount: true },
    }),
    prisma.salesProposal.aggregate({
      where: { status: "APROVADA", approvedAt: { gte: startOfMonth }, deletedAt: null },
      _avg: { estimatedMarginPct: true },
    }),
    prisma.accountReceivable.findMany({
      where: { status: "PAGO", paidAt: { gte: sixMonthsAgo }, orderId: { not: null } },
      select: { amount: true, paidAt: true },
    }),
  ])

  const revenue = Number(revenueThisMonth._sum.amount ?? 0)
  const receivables = Number(receivablesTotal._sum.amount ?? 0)
  const payables = Number(payablesTotal._sum.amount ?? 0)
  const margin = Number(avgMargin._avg.estimatedMarginPct ?? 0)
  const avgTicket = proposalsApproved > 0 ? revenue / proposalsApproved : 0
  const conversionRate = proposalsTotalThisMonth > 0
    ? Math.round((proposalsApproved / proposalsTotalThisMonth) * 100)
    : 0

  // Build last 6 months revenue series
  const monthNames = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"]
  const monthlyRevenue: { label: string; value: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const month = d.getMonth()
    const year = d.getFullYear()
    const total = revenueHistory
      .filter((r) => {
        const pd = r.paidAt!
        return pd.getMonth() === month && pd.getFullYear() === year
      })
      .reduce((sum, r) => sum + Number(r.amount), 0)
    monthlyRevenue.push({ label: monthNames[month], value: total })
  }
  const maxMonthlyRevenue = Math.max(...monthlyRevenue.map((m) => m.value), 1)

  return {
    totalCustomers,
    newCustomersThisMonth,
    totalOpportunities,
    opportunitiesByStage,
    recentActivities,
    stockSummary,
    proposalsTotalThisMonth,
    proposalsApproved,
    ordersAguardando,
    revenue,
    receivables,
    payables,
    margin,
    avgTicket,
    conversionRate,
    monthlyRevenue,
    maxMonthlyRevenue,
  }
}

const activityTypeLabel: Record<string, string> = {
  LIGACAO: "Ligação",
  EMAIL: "E-mail",
  REUNIAO: "Reunião",
  VISITA: "Visita",
  WHATSAPP: "WhatsApp",
  TAREFA: "Tarefa",
  NOTA: "Nota",
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMin / 60)
  const diffD = Math.floor(diffH / 24)
  if (diffMin < 1) return "agora"
  if (diffMin < 60) return `${diffMin}min`
  if (diffH < 24) return `${diffH}h`
  return `${diffD}d`
}

/* ── KPI Card ──────────────────────────────────────────────────── */
function KpiCard({
  label,
  value,
  delta,
  deltaUp,
  href,
}: {
  label: string
  value: string
  delta?: string
  deltaUp?: boolean
  href?: string
}) {
  const inner = (
    <div className="bg-white border border-[#dde0e3] p-4 h-full transition-colors hover:border-[#b5652f]/40">
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "10px",
          color: "#9ba1a8",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontWeight: 600,
          fontSize: "22px",
          color: "#16181c",
          marginTop: "6px",
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
      {delta && (
        <p
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: deltaUp ? "#3f7d4e" : "#b23b32",
            marginTop: "5px",
          }}
        >
          {delta}
        </p>
      )}
    </div>
  )

  if (href) {
    return <Link href={href} className="block">{inner}</Link>
  }
  return inner
}

/* ── Panel ─────────────────────────────────────────────────────── */
function Panel({
  title,
  href,
  children,
}: {
  title: string
  href?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-[#dde0e3] p-[22px]">
      {href ? (
        <Link href={href}>
          <h2
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "16px",
              color: "#16181c",
              textTransform: "uppercase",
              marginBottom: "16px",
              letterSpacing: "0.02em",
            }}
          >
            {title}
          </h2>
        </Link>
      ) : (
        <h2
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "16px",
            color: "#16181c",
            textTransform: "uppercase",
            marginBottom: "16px",
            letterSpacing: "0.02em",
          }}
        >
          {title}
        </h2>
      )}
      {children}
    </div>
  )
}

export default async function DashboardPage() {
  const session = await auth()
  const data = await getDashboardData()

  const kpis = [
    {
      label: "Faturamento no mês",
      value: formatCurrency(data.revenue),
      href: "/financeiro?tab=receber",
    },
    {
      label: "Propostas enviadas",
      value: String(data.proposalsTotalThisMonth),
      href: "/propostas",
    },
    {
      label: "Taxa de conversão",
      value: `${data.conversionRate}%`,
    },
    {
      label: "Ticket médio",
      value: formatCurrency(data.avgTicket),
    },
    {
      label: "Pedidos em aberto",
      value: String(data.ordersAguardando),
      href: "/pedidos?status=AGUARDANDO_EXPEDICAO",
    },
    {
      label: "Valor em estoque",
      value: formatCurrency(data.stockSummary.totalValue),
      href: "/estoque",
    },
    {
      label: "Contas a receber",
      value: formatCurrency(data.receivables),
      href: "/financeiro?tab=receber",
    },
    {
      label: "Contas a pagar",
      value: formatCurrency(data.payables),
      href: "/financeiro?tab=pagar",
    },
    {
      label: "Margem média",
      value: data.margin > 0 ? `${data.margin.toFixed(1)}%` : "—",
    },
    {
      label: "Novos clientes",
      value: String(data.newCustomersThisMonth),
      href: "/clientes",
    },
  ]

  // Funil: max count for bar widths
  const maxOpps = Math.max(
    ...data.opportunitiesByStage.map((s) => s._count.opportunities),
    1
  )

  return (
    <div className="p-6 bg-background min-h-full">
      {/* ── Page header ── */}
      <div className="flex items-end justify-between mb-7 flex-wrap gap-3">
        <div>
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "11px",
              color: "#9ba1a8",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            PAINEL GERAL
          </p>
          <h1
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 800,
              fontSize: "34px",
              color: "#16181c",
              lineHeight: 1,
              marginTop: "2px",
            }}
          >
            Dashboard
          </h1>
        </div>
        <Link
          href="/propostas/nova"
          className="btn-clip text-white inline-flex items-center px-5 py-2.5 font-display font-bold text-[14px] uppercase tracking-[0.02em]"
        >
          Nova Proposta
        </Link>
      </div>

      {/* ── KPI grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 mb-7" style={{ gap: "2px" }}>
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* ── Lower panels ── */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Left: Funil + Chart */}
        <div className="flex flex-col gap-5">
          <Panel title="Funil de oportunidades" href="/crm">
            {data.opportunitiesByStage.length === 0 ? (
              <p className="text-sm text-[#9ba1a8] py-4 text-center">
                Nenhuma etapa cadastrada
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {data.opportunitiesByStage.map((stage) => {
                  const pct = Math.round(
                    (stage._count.opportunities / maxOpps) * 100
                  )
                  return (
                    <div key={stage.id} className="flex items-center gap-3">
                      <div className="w-[120px] text-[12px] font-semibold text-[#6b7178] truncate shrink-0">
                        {stage.name}
                      </div>
                      <div className="flex-1 h-[22px] bg-[#eceef0] relative overflow-hidden">
                        <div
                          className="h-full bg-[#b5652f] transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div
                        className="w-9 text-right shrink-0"
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: "12px",
                          color: "#16181c",
                        }}
                      >
                        {stage._count.opportunities}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Panel>

          <Panel title="Faturamento — últimos 6 meses">
            <div className="flex items-end gap-2.5 h-[110px]">
              {data.monthlyRevenue.map((m) => {
                const heightPct = Math.round((m.value / data.maxMonthlyRevenue) * 100)
                return (
                  <div
                    key={m.label}
                    className="flex-1 flex flex-col items-center gap-1.5"
                  >
                    <div
                      className="w-full bg-[#9ba1a8]"
                      style={{ height: `${Math.max(heightPct, 4)}%` }}
                    />
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#9ba1a8",
                        fontFamily: "'IBM Plex Mono', monospace",
                      }}
                    >
                      {m.label}
                    </div>
                  </div>
                )
              })}
            </div>
          </Panel>
        </div>

        {/* Right: Atividades recentes */}
        <Panel title="Atividades recentes">
          {data.recentActivities.length === 0 ? (
            <p className="text-sm text-[#9ba1a8] py-6 text-center">
              Nenhuma atividade registrada ainda
            </p>
          ) : (
            <div className="flex flex-col">
              {data.recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-2.5 py-2.5 border-b border-[#eceef0] last:border-0"
                >
                  <div
                    className="w-1.5 h-1.5 bg-[#b5652f] shrink-0 mt-[5px]"
                  />
                  <div className="min-w-0">
                    <p className="text-[13px] text-[#21242a] leading-snug">
                      {activity.title}
                    </p>
                    <p
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: "11px",
                        color: "#9ba1a8",
                        marginTop: "2px",
                      }}
                    >
                      {activityTypeLabel[activity.type] ?? activity.type}
                      {" · "}
                      {activity.user.name}
                      {" · "}
                      {formatRelativeTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
