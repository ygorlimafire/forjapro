import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Metadata } from "next"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import {
  Users,
  Package,
  Target,
  TrendingUp,
  ShoppingCart,
  Activity,
  ArrowUpRight,
  Clock,
  Warehouse,
  AlertTriangle,
  FileText,
  Truck,
  TrendingDown,
  CreditCard,
} from "lucide-react"
import { getStockSummary } from "@/actions/stock"
import type { OrderStatus } from "@prisma/client"

export const metadata: Metadata = { title: "Dashboard" }

async function getDashboardData() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalCustomers,
    totalProducts,
    totalLeads,
    totalOpportunities,
    recentLeads,
    recentActivities,
    opportunitiesByStage,
    stockSummary,
    proposalsThisMonth,
    proposalsApproved,
    ordersAguardando,
    receivablesPending,
    payablesOverdue,
  ] = await Promise.all([
    prisma.customer.count({ where: { deletedAt: null } }),
    prisma.product.count({ where: { deletedAt: null, isActive: true } }),
    prisma.lead.count({ where: { deletedAt: null } }),
    prisma.opportunity.count({ where: { deletedAt: null } }),
    prisma.lead.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { assignee: { select: { name: true } } },
    }),
    prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    }),
    prisma.pipelineStage.findMany({
      include: { _count: { select: { opportunities: true } } },
      orderBy: { order: "asc" },
    }),
    getStockSummary().catch(() => ({ totalValue: 0, lowStock: 0, zeroStock: 0 })),
    prisma.salesProposal.count({
      where: { createdAt: { gte: startOfMonth }, status: { in: ["ENVIADA", "EM_NEGOCIACAO"] } },
    }),
    prisma.salesProposal.count({
      where: { approvedAt: { gte: startOfMonth }, status: "APROVADA" },
    }),
    prisma.salesOrder.count({
      where: { status: "AGUARDANDO_EXPEDICAO" as OrderStatus },
    }),
    prisma.accountReceivable.count({
      where: { status: "PENDENTE" },
    }),
    prisma.accountPayable.count({
      where: { status: "PENDENTE", dueDate: { lt: now } },
    }),
  ])

  return {
    totalCustomers,
    totalProducts,
    totalLeads,
    totalOpportunities,
    recentLeads,
    recentActivities,
    opportunitiesByStage,
    stockSummary,
    proposalsThisMonth,
    proposalsApproved,
    ordersAguardando,
    receivablesPending,
    payablesOverdue,
  }
}

const statusColors: Record<string, string> = {
  NOVO: "bg-blue-500/10 text-blue-600",
  CONTATO: "bg-yellow-500/10 text-yellow-600",
  QUALIFICADO: "bg-green-500/10 text-green-600",
  CONVERTIDO: "bg-purple-500/10 text-purple-600",
  DESCARTADO: "bg-red-500/10 text-red-600",
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

export default async function DashboardPage() {
  const session = await auth()
  const data = await getDashboardData()
  const { stockSummary } = data
  const hasStockAlerts = stockSummary.lowStock + stockSummary.zeroStock > 0

  type StatItem = {
    title: string
    value: string | number
    description: string
    icon: React.ElementType
    color: string
    href?: string
    alert?: boolean
  }

  const stats: StatItem[] = [
    {
      title: "Clientes",
      value: data.totalCustomers,
      description: "cadastros ativos",
      icon: Users,
      color: "text-blue-500",
      href: "/clientes",
    },
    {
      title: "Leads",
      value: data.totalLeads,
      description: "em acompanhamento",
      icon: Target,
      color: "text-orange-500",
      href: "/crm",
    },
    {
      title: "Oportunidades",
      value: data.totalOpportunities,
      description: "no funil de vendas",
      icon: TrendingUp,
      color: "text-purple-500",
      href: "/crm",
    },
    {
      title: "Propostas (mês)",
      value: data.proposalsThisMonth,
      description: `${data.proposalsApproved} aprovada${data.proposalsApproved !== 1 ? "s" : ""} este mês`,
      icon: FileText,
      color: "text-indigo-500",
      href: "/propostas",
    },
    {
      title: "Aguardando expedição",
      value: data.ordersAguardando,
      description: "pedidos prontos para enviar",
      icon: Truck,
      color: data.ordersAguardando > 0 ? "text-yellow-500" : "text-muted-foreground/30",
      href: data.ordersAguardando > 0 ? "/pedidos?status=AGUARDANDO_EXPEDICAO" : "/pedidos",
      alert: data.ordersAguardando > 0,
    },
    {
      title: "Produtos",
      value: data.totalProducts,
      description: "itens disponíveis",
      icon: Package,
      color: "text-green-500",
      href: "/produtos",
    },
    {
      title: "Valor em Estoque",
      value: formatCurrency(stockSummary.totalValue),
      description: "custo médio ponderado",
      icon: Warehouse,
      color: "text-cyan-500",
      href: "/estoque",
    },
    {
      title: "Alertas de Estoque",
      value: stockSummary.lowStock + stockSummary.zeroStock,
      description: `${stockSummary.zeroStock} zerado${stockSummary.zeroStock !== 1 ? "s" : ""} · ${stockSummary.lowStock} baixo${stockSummary.lowStock !== 1 ? "s" : ""}`,
      icon: AlertTriangle,
      color: hasStockAlerts ? "text-yellow-500" : "text-muted-foreground/30",
      href: "/estoque",
      alert: hasStockAlerts,
    },
    {
      title: "A Receber",
      value: data.receivablesPending,
      description: "contas a receber pendentes",
      icon: TrendingUp,
      color: data.receivablesPending > 0 ? "text-emerald-500" : "text-muted-foreground/30",
      href: "/financeiro?tab=receber",
    },
    {
      title: "A Pagar (vencidas)",
      value: data.payablesOverdue,
      description: "contas vencidas não pagas",
      icon: data.payablesOverdue > 0 ? TrendingDown : CreditCard,
      color: data.payablesOverdue > 0 ? "text-red-500" : "text-muted-foreground/30",
      href: "/financeiro?tab=pagar",
      alert: data.payablesOverdue > 0,
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Bom dia, {session?.user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Aqui está o resumo comercial de hoje — {formatDate(new Date())}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon
          const inner = (
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className={cn("text-3xl font-bold mt-1", stat.alert && "text-yellow-600 dark:text-yellow-400")}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </div>
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <Icon size={20} />
                </div>
              </div>
            </CardContent>
          )

          if (stat.href) {
            return (
              <Link key={stat.title} href={stat.href} className="block group">
                <Card className={cn(
                  "transition-all duration-150 group-hover:shadow-md group-hover:border-foreground/20",
                  stat.alert && "border-yellow-300/60 dark:border-yellow-800/60"
                )}>
                  {inner}
                </Card>
              </Link>
            )
          }

          return <Card key={stat.title}>{inner}</Card>
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Funil por etapa */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <Link href="/crm" className="flex items-center justify-between group">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingCart size={16} />
                  Funil de Vendas
                </CardTitle>
                <CardDescription>Oportunidades por etapa</CardDescription>
              </div>
              <ArrowUpRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.opportunitiesByStage.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma etapa cadastrada
              </p>
            ) : (
              data.opportunitiesByStage.map((stage) => (
                <Link
                  key={stage.id}
                  href="/crm"
                  className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="text-sm flex-1 truncate">{stage.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {stage._count.opportunities}
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Leads recentes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <Link href="/crm" className="flex items-center justify-between group">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target size={16} />
                  Leads Recentes
                </CardTitle>
                <CardDescription>Últimas entradas no CRM</CardDescription>
              </div>
              <ArrowUpRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum lead registrado ainda
              </p>
            ) : (
              <div className="space-y-1">
                {data.recentLeads.map((lead) => (
                  <Link
                    key={lead.id}
                    href="/crm"
                    className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/50 transition-colors border-b last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{lead.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {lead.company || "Sem empresa"} · {lead.assignee?.name || "Sem responsável"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[lead.status] || ""}`}
                      >
                        {lead.status}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(lead.createdAt)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Atividades recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity size={16} />
            Atividades Recentes
          </CardTitle>
          <CardDescription>Últimas interações registradas</CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhuma atividade registrada ainda
            </p>
          ) : (
            <div className="space-y-3">
              {data.recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 py-2 border-b last:border-0"
                >
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <Clock size={12} className="text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {activityTypeLabel[activity.type]} · {activity.user.name} · {formatDate(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
