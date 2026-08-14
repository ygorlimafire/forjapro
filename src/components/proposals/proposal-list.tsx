"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Eye, Edit, FileText } from "lucide-react"
import type { ProposalStatus } from "@prisma/client"

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ProposalRow {
  id: string
  number: string
  status: ProposalStatus
  totalAmount: any
  estimatedMarginPct: any
  validityDate: Date | null
  createdAt: Date
  customer: { companyName: string | null; tradeName: string | null; document: string }
  seller: { name: string }
  _count: { items: number }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "RASCUNHO", label: "Rascunho" },
  { value: "ENVIADA", label: "Enviada" },
  { value: "EM_NEGOCIACAO", label: "Em Negociação" },
  { value: "APROVADA", label: "Aprovada" },
  { value: "RECUSADA", label: "Recusada" },
  { value: "VENCIDA", label: "Vencida" },
]

const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }

export function ProposalList({ proposals }: { proposals: ProposalRow[] }) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const filtered = proposals.filter((p) => {
    const customerName = p.customer.companyName || p.customer.tradeName || p.customer.document
    const matchSearch =
      !search ||
      p.number.toLowerCase().includes(search.toLowerCase()) ||
      customerName.toLowerCase().includes(search.toLowerCase()) ||
      p.seller.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || p.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="bg-white border border-[#dde0e3]">
      {/* ── Search + status chips ── */}
      <div className="flex flex-wrap gap-2.5 items-center px-4 py-3.5 border-b border-[#eceef0]">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nº, cliente ou vendedor..."
          className="flex-1 min-w-[200px] max-w-[280px] px-3 py-2 bg-[#f5f6f7] border border-[#dde0e3] text-[13px] text-[#21242a] placeholder:text-[#9ba1a8] outline-none focus:border-[#b5652f] transition-colors"
        />
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={
                statusFilter === s.value
                  ? "px-3 py-1.5 text-[12px] font-semibold bg-[#16181c] text-white transition-colors"
                  : "px-3 py-1.5 text-[12px] font-semibold border border-[#dde0e3] text-[#6b7178] hover:border-[#b5652f] hover:text-[#16181c] transition-colors"
              }
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Desktop header ── */}
      <div
        className="hidden md:grid px-4 py-2.5 bg-[#f5f6f7]"
        style={{ ...mono, fontSize: "11px", color: "#9ba1a8", gridTemplateColumns: "0.7fr 1.4fr 1fr 0.7fr 0.9fr 0.9fr auto" }}
      >
        <div>Nº</div>
        <div>CLIENTE</div>
        <div>VALOR</div>
        <div>MARGEM</div>
        <div>DATA</div>
        <div>STATUS</div>
        <div />
      </div>

      {/* ── Rows ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-2">
          <FileText size={32} className="text-[#dde0e3]" />
          <p className="text-[13px] text-[#9ba1a8]">
            {proposals.length === 0
              ? "Nenhuma proposta criada ainda"
              : "Nenhuma proposta encontrada"}
          </p>
        </div>
      ) : (
        filtered.map((p) => {
          const customerName = p.customer.companyName || p.customer.tradeName || p.customer.document
          const marginPct = Number(p.estimatedMarginPct ?? 0)
          const marginColor = marginPct < 15 ? "#b23b32" : marginPct < 30 ? "#8a6d00" : "#3f7d4e"

          return (
            <div key={p.id} className="border-t border-[#eceef0] group">
              {/* Desktop */}
              <div
                className="hidden md:grid items-center px-4 py-3.5 text-[14px] hover:bg-[#f5f6f7] transition-colors cursor-pointer"
                style={{ gridTemplateColumns: "0.7fr 1.4fr 1fr 0.7fr 0.9fr 0.9fr auto" }}
                onClick={() => router.push(`/propostas/${p.id}`)}
              >
                <div style={{ ...mono, fontSize: "12px", color: "#9ba1a8" }}>{p.number}</div>
                <div className="font-semibold text-[#16181c] truncate pr-3">{customerName}</div>
                <div style={{ ...mono, fontSize: "13px" }}>{formatCurrency(Number(p.totalAmount))}</div>
                <div style={{ ...mono, fontSize: "13px", fontWeight: 600, color: marginColor }}>
                  {marginPct > 0 ? `${marginPct.toFixed(1)}%` : "—"}
                </div>
                <div className="text-[#6b7178] text-[13px]">{formatDate(p.createdAt)}</div>
                <div><StatusBadge status={p.status} /></div>
                <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => router.push(`/propostas/${p.id}`)}
                    className="p-1.5 text-[#9ba1a8] hover:text-[#16181c] transition-colors"
                    title="Ver"
                  >
                    <Eye size={13} />
                  </button>
                  <button
                    onClick={() => router.push(`/propostas/${p.id}/editar`)}
                    className="p-1.5 text-[#9ba1a8] hover:text-[#16181c] transition-colors"
                    title="Editar"
                  >
                    <Edit size={13} />
                  </button>
                </div>
              </div>

              {/* Mobile */}
              <div
                className="md:hidden px-4 py-3.5 cursor-pointer hover:bg-[#f5f6f7] transition-colors"
                onClick={() => router.push(`/propostas/${p.id}`)}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold text-[14px] text-[#16181c] truncate">{customerName}</span>
                  <StatusBadge status={p.status} />
                </div>
                <p style={mono} className="text-[11px] text-[#9ba1a8]">
                  {p.number} · {formatCurrency(Number(p.totalAmount))} · {formatDate(p.createdAt)}
                </p>
              </div>
            </div>
          )
        })
      )}

      {filtered.length > 0 && (
        <div className="px-4 py-2.5 border-t border-[#eceef0]">
          <p style={{ ...mono, fontSize: "11px", color: "#9ba1a8" }}>
            {filtered.length} proposta{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  )
}
