import Link from "next/link"
import { getPurchaseOrders } from "@/actions/purchases"
import { formatCurrency, formatDate } from "@/lib/utils"
import { StatusBadge } from "@/components/ui/status-badge"
import { ShoppingCart, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PurchaseOrderStatus } from "@prisma/client"
import type { PageProps } from "@/types"

const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }

const STATUS_LABEL: Record<PurchaseOrderStatus, string> = {
  RASCUNHO: "Rascunho",
  ENVIADO: "Enviado",
  CONFIRMADO: "Confirmado",
  RECEBIDO_PARCIAL: "Parcial",
  RECEBIDO_TOTAL: "Recebido",
  CANCELADO: "Cancelado",
}

const STATUSES: PurchaseOrderStatus[] = [
  "RASCUNHO", "ENVIADO", "CONFIRMADO", "RECEBIDO_PARCIAL", "RECEBIDO_TOTAL", "CANCELADO",
]

// Map purchase status to StatusBadge variant keys
const STATUS_MAP: Record<PurchaseOrderStatus, string> = {
  RASCUNHO: "RASCUNHO",
  ENVIADO: "ENVIADA",
  CONFIRMADO: "CONFIRMADO",
  RECEBIDO_PARCIAL: "PENDENTE",
  RECEBIDO_TOTAL: "RECEBIDA",
  CANCELADO: "CANCELADO",
}

export default async function ComprasPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const status = sp.status as PurchaseOrderStatus | undefined

  const orders = await getPurchaseOrders({ status })

  function chipClass(active: boolean) {
    return cn(
      "inline-flex items-center px-3.5 py-1.5 text-[12px] font-semibold transition-colors",
      active
        ? "bg-[#16181c] text-white"
        : "border border-[#dde0e3] text-[#6b7178] hover:border-[#b5652f] hover:text-[#16181c]"
    )
  }

  return (
    <div className="p-6 bg-background min-h-full">
      {/* ── Header ── */}
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <p style={{ ...mono, fontSize: "11px", color: "#9ba1a8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            SUPRIMENTOS
          </p>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "34px", color: "#16181c", lineHeight: 1, marginTop: "2px" }}>
            Compras
          </h1>
        </div>
        <div className="flex gap-2 items-center">
          <Link
            href="/compras/sugeridas"
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#dde0e3] font-display font-bold text-[13px] uppercase tracking-[0.02em] text-[#6b7178] hover:border-[#b5652f] hover:text-[#16181c] transition-colors"
          >
            <AlertTriangle size={13} />
            Sugeridas
          </Link>
          <Link
            href="/compras/nova"
            className="btn-clip text-white inline-flex items-center px-5 py-2.5 font-display font-bold text-[14px] uppercase tracking-[0.02em]"
          >
            Nova Compra
          </Link>
        </div>
      </div>

      {/* ── Status chips ── */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Link href="/compras"><span className={chipClass(!status)}>Todos</span></Link>
        {STATUSES.map((s) => (
          <Link key={s} href={`/compras?status=${s}`}>
            <span className={chipClass(status === s)}>{STATUS_LABEL[s]}</span>
          </Link>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-[#dde0e3]">
        {/* Desktop header */}
        <div
          className="hidden sm:grid px-4 py-2.5 bg-[#f5f6f7]"
          style={{ ...mono, fontSize: "11px", color: "#9ba1a8", gridTemplateColumns: "0.5fr 1.5fr 1fr 0.9fr 0.9fr" }}
        >
          <div>Nº</div>
          <div>FORNECEDOR</div>
          <div>VALOR</div>
          <div>DATA</div>
          <div>STATUS</div>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2">
            <ShoppingCart size={32} className="text-[#dde0e3]" />
            <p className="text-[13px] text-[#9ba1a8]">Nenhum pedido de compra encontrado</p>
          </div>
        ) : (
          orders.map((po) => {
            const supplierName = po.supplier.tradeName || po.supplier.companyName
            const badgeStatus = STATUS_MAP[po.status]

            return (
              <div key={po.id} className="border-t border-[#eceef0] group">
                {/* Desktop */}
                <Link
                  href={`/compras/${po.id}`}
                  className="hidden sm:grid items-center px-4 py-3.5 text-[14px] hover:bg-[#f5f6f7] transition-colors"
                  style={{ gridTemplateColumns: "0.5fr 1.5fr 1fr 0.9fr 0.9fr" }}
                >
                  <div style={{ ...mono, fontSize: "12px", color: "#9ba1a8" }}>{po.number}</div>
                  <div className="font-semibold text-[#16181c] truncate pr-3">{supplierName}</div>
                  <div style={{ ...mono, fontSize: "13px" }}>{formatCurrency(Number(po.totalAmount))}</div>
                  <div className="text-[#6b7178] text-[13px]">{formatDate(po.createdAt)}</div>
                  <div><StatusBadge status={badgeStatus} /></div>
                </Link>

                {/* Mobile */}
                <Link href={`/compras/${po.id}`} className="sm:hidden block px-4 py-3.5 hover:bg-[#f5f6f7] transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-[14px] text-[#16181c] truncate">{supplierName}</span>
                    <StatusBadge status={badgeStatus} />
                  </div>
                  <p style={mono} className="text-[11px] text-[#9ba1a8]">
                    {po.number} · {formatCurrency(Number(po.totalAmount))} · {formatDate(po.createdAt)}
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
