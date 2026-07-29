import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Metadata } from "next"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  Users,
  Package,
  Target,
  TrendingUp,
  ShoppingCart,
  Activity,
  ArrowUpRight,
  Clock,
} from "lucide-react"

export const metadata: Metadata = { title: "Dashboard" }

async function getDashboardData() {
  const [
    totalCustomers,
    totalProducts,
    totalLeads,
    totalOpportunities,
    recentLeads,
    recentActivities,
    opportunitiesByStage,
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
      include: {
        _count: { select: { opportunities: true } },
      },
      orderBy: { order: "asc" },
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

  const stats = [
    {
      title: "Clientes",
      value: data.totalCustomers,
      description: "cadastros ativos",
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Produtos",
      value: data.totalProducts,
      description: "itens disponíveis",
      icon: Package,
      color: "text-green-500",
    },
    {
      title: "Leads",
      value: data.totalLeads,
      description: "em acompanhamento",
      icon: Target,
      color: "text-orange-500",
    },
    {
      title: "Oportunidades",
      value: data.totalOpportunities,
      description: "no funil de vendas",
      icon: TrendingUp,
      color: "text-purple-500",
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  </div>
                  <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                    <Icon size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Funil por etapa */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart size={16} />
              Funil de Vendas
            </CardTitle>
            <CardDescription>Oportunidades por etapa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.opportunitiesByStage.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma etapa cadastrada
              </p>
            ) : (
              data.opportunitiesByStage.map((stage) => (
                <div key={stage.id} className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="text-sm flex-1 truncate">{stage.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {stage._count.opportunities}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Leads recentes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target size={16} />
                  Leads Recentes
                </CardTitle>
                <CardDescription>Últimas entradas no CRM</CardDescription>
              </div>
              <ArrowUpRight size={16} className="text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {data.recentLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum lead registrado ainda
              </p>
            ) : (
              <div className="space-y-3">
                {data.recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
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
                  </div>
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
