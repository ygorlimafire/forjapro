import { getOrders } from "@/actions/orders"
import { formatCurrency, formatDate } from "@/lib/utils"
import { StatusBadge } from "@/components/ui/status-badge"
import { ShoppingCart, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { OrderStatus, StockAlertStatus } from "@prisma/client"
import type { PageProps } from "@/types"

const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDENTE: "Pendente",
  CONFIRMADO: "Confirmado",
  AGUARDANDO_EXPEDICAO: "Ag. Expedição",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
}

const STATUSES: OrderStatus[] = ["PENDENTE", "CONFIRMADO", "AGUARDANDO_EXPEDICAO", "ENTREGUE", "CANCELADO"]

export default async function PedidosPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const statusFilter = (sp.status as OrderStatus | undefined) ?? undefined
  const stockAlert = sp.stock === "alerta"

  const [orders, allOrders] = await Promise.all([
    getOrders({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(stockAlert ? { stockAlert: true } : {}),
    }),
    getOrders(),
  ])

  const alertCount = allOrders.filter((o) => o.stockStatus !== "OK").length
  const counts = allOrders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1
    return acc
  }, {} as Record<OrderStatus, number>)

  const activeTab = stockAlert ? "stock" : statusFilter ?? "all"

  function chipClass(active: boolean) {
    return cn(
      "inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-semibold transition-colors",
      active
        ? "bg-[#16181c] text-white"
        : "border border-[#dde0e3] text-[#6b7178] hover:border-[#b5652f] hover:text-[#16181c]"
    )
  }

  return (
    <div className="p-6 bg-background min-h-full">
      {/* ── Header ── */}
      <div className="mb-6">
        <p style={{ ...mono, fontSize: "11px", color: "#9ba1a8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          COMERCIAL
        </p>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "34px", color: "#16181c", lineHeight: 1, marginTop: "2px" }}>
          Pedidos
        </h1>
      </div>

      {/* ── Status chips ── */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Link href="/pedidos"><span className={chipClass(activeTab === "all")}>Todos ({allOrders.length})</span></Link>
        {STATUSES.map((s) => (
          <Link key={s} href={`/pedidos?status=${s}`}>
            <span className={chipClass(activeTab === s)}>
              {STATUS_LABEL[s]} ({counts[s] ?? 0})
            </span>
          </Link>
        ))}
        {alertCount > 0 && (
          <Link href="/pedidos?stock=alerta">
            <span className={cn(
              chipClass(activeTab === "stock"),
              activeTab === "stock" ? "" : "!border-[#b23b32] !text-[#b23b32] hover:!text-[#b23b32]"
            )}>
              <AlertTriangle size={12} />
              Est. insuficiente ({alertCount})
            </span>
          </Link>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-[#dde0e3]">
        {/* Desktop header */}
        <div
          className="hidden sm:grid px-4 py-2.5 bg-[#f5f6f7]"
          style={{ ...mono, fontSize: "11px", color: "#9ba1a8", gridTemplateColumns: "0.5fr 1.4fr 1fr 0.9fr 0.9fr" }}
        >
          <div>Nº PROP.</div>
          <div>CLIENTE</div>
          <div>VALOR</div>
          <div>DATA</div>
          <div>STATUS</div>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2">
            <ShoppingCart size={32} className="text-[#dde0e3]" />
            <p className="text-[13px] text-[#9ba1a8]">
              {stockAlert
                ? "Nenhum pedido com alerta de estoque"
                : "Nenhum pedido encontrado"}
            </p>
          </div>
        ) : (
          orders.map((order) => {
            const customerName = order.customer.companyName || order.customer.tradeName || order.customer.document
            const hasStockAlert = order.stockStatus !== "OK"

            return (
              <div key={order.id} className="border-t border-[#eceef0] group">
                {/* Desktop */}
                <Link
                  href={`/pedidos/${order.id}`}
                  className="hidden sm:grid items-center px-4 py-3.5 text-[14px] hover:bg-[#f5f6f7] transition-colors"
                  style={{ gridTemplateColumns: "0.5fr 1.4fr 1fr 0.9fr 0.9fr" }}
                >
                  <div style={{ ...mono, fontSize: "12px", color: "#9ba1a8" }}>
                    {order.proposal.number}
                  </div>
                  <div className="min-w-0 pr-3">
                    <p className="font-semibold text-[#16181c] truncate">{customerName}</p>
                    {hasStockAlert && (
                      <p className="flex items-center gap-1 text-[11px] text-[#b23b32] mt-0.5">
                        <AlertTriangle size={10} />
                        {order.stockStatus === "PARCIAL" ? "Estoque parcial" : "Sem estoque"}
                      </p>
                    )}
                  </div>
                  <div style={{ ...mono, fontSize: "13px" }}>{formatCurrency(Number(order.totalAmount))}</div>
                  <div className="text-[#6b7178] text-[13px]">{formatDate(order.createdAt)}</div>
                  <div><StatusBadge status={order.status} /></div>
                </Link>

                {/* Mobile */}
                <Link href={`/pedidos/${order.id}`} className="sm:hidden block px-4 py-3.5 hover:bg-[#f5f6f7] transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-[14px] text-[#16181c] truncate">{customerName}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <p style={mono} className="text-[11px] text-[#9ba1a8]">
                    {order.proposal.number} · {formatCurrency(Number(order.totalAmount))} · {formatDate(order.createdAt)}
                  </p>
                </Link>
              </div>
            )
          })
        )}
      </div>

      {orders.length > 0 && (
        <p style={mono} className="mt-3 text-[11px] text-[#9ba1a8]">
          {orders.length} pedido{orders.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  )
}
