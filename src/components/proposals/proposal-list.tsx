"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ProposalStatusBadge } from "./proposal-status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Search, Plus, Eye, Edit } from "lucide-react"
import type { ProposalStatus } from "@prisma/client"

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ProposalRow {
  id: string
  number: string
  status: ProposalStatus
  totalAmount: any        // Prisma Decimal
  estimatedMarginPct: any // Prisma Decimal
  validityDate: Date | null
  createdAt: Date
  customer: { companyName: string | null; tradeName: string | null; document: string }
  seller: { name: string }
  _count: { items: number }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Todos os status" },
  { value: "RASCUNHO", label: "Rascunho" },
  { value: "ENVIADA", label: "Enviada" },
  { value: "EM_NEGOCIACAO", label: "Em Negociação" },
  { value: "APROVADA", label: "Aprovada" },
  { value: "RECUSADA", label: "Recusada" },
  { value: "VENCIDA", label: "Vencida" },
]

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
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nº, cliente ou vendedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          className="px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring w-full sm:w-48"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <Button onClick={() => router.push("/propostas/nova")}>
          <Plus size={14} />
          Nova proposta
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nº</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Vendedor</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Valor</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden sm:table-cell">Margem</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Data</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Validade</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    {proposals.length === 0
                      ? "Nenhuma proposta criada ainda"
                      : "Nenhuma proposta encontrada com os filtros aplicados"}
                  </td>
                </tr>
              )}
              {filtered.map((proposal) => {
                const customerName = proposal.customer.companyName || proposal.customer.tradeName || proposal.customer.document
                const marginPct = Number(proposal.estimatedMarginPct ?? 0)
                const isExpired =
                  proposal.validityDate &&
                  new Date(proposal.validityDate) < new Date() &&
                  proposal.status !== "APROVADA"

                return (
                  <tr
                    key={proposal.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono font-medium">{proposal.number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium truncate max-w-[160px]">{customerName}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {proposal.seller.name}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(Number(proposal.totalAmount))}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      <span className={
                        marginPct < 15 ? "text-red-600 font-medium" :
                        marginPct < 30 ? "text-yellow-600" : "text-green-600"
                      }>
                        {marginPct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ProposalStatusBadge status={proposal.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs">
                      {formatDate(proposal.createdAt)}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs">
                      <span className={isExpired ? "text-orange-600 font-medium" : "text-muted-foreground"}>
                        {proposal.validityDate ? formatDate(proposal.validityDate) : "—"}
                        {isExpired && " ⚠"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => router.push(`/propostas/${proposal.id}`)}
                        >
                          <Eye size={13} />
                        </Button>
                        {!proposal.status.match(/APROVADA|RECUSADA/) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => router.push(`/propostas/${proposal.id}/editar`)}
                          >
                            <Edit size={13} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "proposta" : "propostas"} encontradas
      </p>
    </div>
  )
}
