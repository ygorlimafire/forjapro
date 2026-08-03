import { getOrders } from "@/actions/orders"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { ShoppingCart, ArrowRight, AlertTriangle } from "lucide-react"
import Link from "next/link"
import type { OrderStatus, StockAlertStatus } from "@prisma/client"
import type { PageProps } from "@/types"

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDENTE: "Pendente",
  CONFIRMADO: "Confirmado",
  AGUARDANDO_EXPEDICAO: "Ag. Expedição",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
}

const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDENTE: "text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950/30 dark:border-yellow-900/50",
  CONFIRMADO: "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/30 dark:border-blue-900/50",
  AGUARDANDO_EXPEDICAO: "text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950/30 dark:border-purple-900/50",
  ENTREGUE: "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/30 dark:border-green-900/50",
  CANCELADO: "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/30 dark:border-red-900/50",
}

const STOCK_BADGE: Record<Exclude<StockAlertStatus, "OK">, { label: string; className: string }> = {
  PARCIAL: {
    label: "Estoque parcial",
    className: "text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950/30 dark:border-orange-900/50",
  },
  INSUFICIENTE: {
    label: "Sem estoque",
    className: "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/30 dark:border-red-900/50",
  },
}

const STATUSES: OrderStatus[] = ["PENDENTE", "CONFIRMADO", "AGUARDANDO_EXPEDICAO", "ENTREGUE", "CANCELADO"]

export default async function PedidosPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const statusFilter = (sp.status as OrderStatus | undefined) ?? undefined
  const stockAlert = sp.stock === "alerta"

  const orders = await getOrders({
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(stockAlert ? { stockAlert: true } : {}),
  })

  const allOrders = await getOrders()
  const alertCount = allOrders.filter((o) => o.stockStatus !== "OK").length

  const counts = allOrders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1
    return acc
  }, {} as Record<OrderStatus, number>)

  const activeTabBase = stockAlert ? "stock" : statusFilter ?? "all"

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {orders.length} pedido{orders.length !== 1 ? "s" : ""}
            {statusFilter ? ` · ${STATUS_LABEL[statusFilter]}` : ""}
            {stockAlert ? " · Com alerta de estoque" : ""}
          </p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        <Link
          href="/pedidos"
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            activeTabBase === "all"
              ? "bg-foreground text-background border-foreground"
              : "bg-background text-muted-foreground border-border hover:border-foreground/30"
          }`}
        >
          Todos ({allOrders.length})
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/pedidos?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeTabBase === s
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground border-border hover:border-foreground/30"
            }`}
          >
            {STATUS_LABEL[s]} ({counts[s] ?? 0})
          </Link>
        ))}
        {alertCount > 0 && (
          <Link
            href="/pedidos?stock=alerta"
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors flex items-center gap-1.5 ${
              activeTabBase === "stock"
                ? "bg-orange-600 text-white border-orange-600"
                : "text-orange-700 bg-orange-50 border-orange-200 hover:border-orange-400 dark:text-orange-400 dark:bg-orange-950/30 dark:border-orange-900/50"
            }`}
          >
            <AlertTriangle size={13} />
            Alerta de estoque ({alertCount})
          </Link>
        )}
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <ShoppingCart size={40} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">Nenhum pedido encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              {stockAlert
                ? "Nenhum pedido com alerta de estoque no momento."
                : "Pedidos são criados automaticamente ao aprovar uma proposta."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => {
            const customerName = order.customer.companyName || order.customer.tradeName || order.customer.document
            const stockBadge = order.stockStatus !== "OK" ? STOCK_BADGE[order.stockStatus as Exclude<StockAlertStatus, "OK">] : null
            return (
              <Link key={order.id} href={`/pedidos/${order.id}`}>
                <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/40 transition-colors group">
                  <div className="shrink-0 flex flex-col gap-1.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLOR[order.status]}`}>
                      {STATUS_LABEL[order.status]}
                    </span>
                    {stockBadge && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${stockBadge.className}`}>
                        <AlertTriangle size={10} />
                        {stockBadge.label}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      Proposta {order.proposal.number} · {order._count.items} item{order._count.items !== 1 ? "s" : ""} · {order.seller.name}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm">{formatCurrency(Number(order.totalAmount))}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                  </div>

                  <ArrowRight size={16} className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
