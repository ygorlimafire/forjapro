"use client"

import { useState } from "react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import { MarkPaidDialog } from "./mark-paid-dialog"
import { NewAccountDialog } from "./new-account-dialog"
import { NegotiationDialog } from "./negotiation-dialog"
import { CsvExportButton } from "./csv-export-button"
import { CheckCircle2, AlertTriangle, Clock, XCircle, FileText, ExternalLink, Plus, RotateCcw } from "lucide-react"
import type { ReceivableStatus } from "@prisma/client"

type Receivable = {
  id: string
  amount: number
  dueDate: Date
  status: ReceivableStatus
  paidAt: Date | null
  paymentMethod: string | null
  proofUrl: string | null
  notes: string | null
  description: string | null
  installment: number
  totalInstallments: number
  discountPct: number | null
  lateFeePerDay: number | null
  originalDueDate: Date | null
  originalAmount: number | null
  customer: { id: string; companyName: string | null; tradeName: string | null; document: string } | null
  order: { id: string; proposal: { number: string } } | null
}

type BankAccount = { id: string; name: string }

interface Props {
  receivables: Receivable[]
  bankAccounts?: BankAccount[]
}

const STATUS_CONFIG: Record<ReceivableStatus, { label: string; className: string; icon: React.ReactNode }> = {
  PENDENTE: {
    label: "A receber",
    className: "text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950/30 dark:border-yellow-900/50",
    icon: <Clock size={11} />,
  },
  PAGO: {
    label: "Recebido",
    className: "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/30 dark:border-green-900/50",
    icon: <CheckCircle2 size={11} />,
  },
  VENCIDO: {
    label: "Vencido",
    className: "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/30 dark:border-red-900/50",
    icon: <AlertTriangle size={11} />,
  },
  CANCELADO: {
    label: "Cancelado",
    className: "text-muted-foreground bg-muted border-border",
    icon: <XCircle size={11} />,
  },
}

function computeAdjustedAmount(rec: Receivable): { adjusted: number; hasAdjustment: boolean } {
  const today = new Date()
  const base = rec.amount
  let adjusted = base

  if (rec.lateFeePerDay && rec.lateFeePerDay > 0) {
    const overdueDays = Math.max(0, Math.floor((today.getTime() - new Date(rec.dueDate).getTime()) / (1000 * 60 * 60 * 24)))
    if (overdueDays > 0) {
      adjusted += base * (rec.lateFeePerDay / 100) * overdueDays
    }
  }

  if (rec.discountPct && rec.discountPct > 0) {
    adjusted -= base * (rec.discountPct / 100)
  }

  return { adjusted, hasAdjustment: Math.abs(adjusted - base) > 0.01 }
}

export function ReceivablesList({ receivables, bankAccounts = [] }: Props) {
  const [selected, setSelected] = useState<Receivable | null>(null)
  const [negotiating, setNegotiating] = useState<Receivable | null>(null)
  const [newDialogOpen, setNewDialogOpen] = useState(false)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const totalPending = receivables
    .filter((r) => r.status === "PENDENTE")
    .reduce((s, r) => s + Number(r.amount), 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        {totalPending > 0 ? (
          <>
            <p className="text-xs text-muted-foreground">{receivables.length} conta{receivables.length !== 1 ? "s" : ""}</p>
            <p className="text-xs text-muted-foreground">
              A receber: <span className="font-semibold text-foreground">{formatCurrency(totalPending)}</span>
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">{receivables.length} conta{receivables.length !== 1 ? "s" : ""}</p>
        )}
        <div className="flex items-center gap-3">
          <CsvExportButton
            data={receivables.map((r) => ({
              cliente: r.customer ? (r.customer.companyName || r.customer.tradeName || r.customer.document) : (r.description ?? ""),
              pedido: r.order?.proposal.number ?? "",
              valor: Number(r.amount),
              vencimento: new Date(r.dueDate),
              status: r.status,
              recebido_em: r.paidAt ? new Date(r.paidAt) : null,
              forma_pagamento: r.paymentMethod ?? "",
            }))}
            columns={[
              { key: "cliente", label: "Cliente/Descrição" },
              { key: "pedido", label: "Pedido" },
              { key: "valor", label: "Valor" },
              { key: "vencimento", label: "Vencimento" },
              { key: "status", label: "Status" },
              { key: "recebido_em", label: "Recebido em" },
              { key: "forma_pagamento", label: "Forma de Pagamento" },
            ]}
            filename="contas-a-receber.csv"
          />
          <button
            type="button"
            onClick={() => setNewDialogOpen(true)}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
          >
            <Plus size={12} /> Nova conta
          </button>
        </div>
      </div>

      {receivables.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText size={36} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma conta a receber encontrada</p>
        </div>
      )}

      <div className="space-y-2">
        {receivables.map((rec) => {
          const isOverdue = rec.status === "PENDENTE" && new Date(rec.dueDate) < today
          const customerName = rec.customer
            ? (rec.customer.companyName || rec.customer.tradeName || rec.customer.document)
            : (rec.description ?? "Lançamento avulso")
          const config = isOverdue ? STATUS_CONFIG.VENCIDO : STATUS_CONFIG[rec.status]
          const { adjusted, hasAdjustment } = computeAdjustedAmount(rec)

          return (
            <div
              key={rec.id}
              className={`flex items-center gap-4 p-4 rounded-xl border bg-card ${isOverdue ? "border-red-200 dark:border-red-900/50" : ""}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
                    {config.icon}
                    {isOverdue ? "Vencido" : config.label}
                  </span>
                  {rec.order && (
                    <Link
                      href={`/pedidos/${rec.order.id}`}
                      className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
                    >
                      {rec.order.proposal.number}
                      {rec.totalInstallments > 1 && ` · Parcela ${rec.installment}/${rec.totalInstallments}`}
                      <ExternalLink size={10} className="ml-0.5" />
                    </Link>
                  )}
                  {rec.originalDueDate && (
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <RotateCcw size={10} />
                      Renegociado
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium">{customerName}</p>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                  <span>Vence: {formatDate(rec.dueDate)}</span>
                  {rec.paidAt && <span>Recebido: {formatDate(rec.paidAt)}</span>}
                  {rec.paymentMethod && <span>{rec.paymentMethod}</span>}
                  {rec.discountPct && rec.discountPct > 0 && (
                    <span className="text-green-600 dark:text-green-400">Desconto {rec.discountPct}%</span>
                  )}
                  {rec.lateFeePerDay && rec.lateFeePerDay > 0 && (
                    <span className="text-orange-600 dark:text-orange-400">Juros {rec.lateFeePerDay}%/dia</span>
                  )}
                  {rec.proofUrl && (
                    <a href={rec.proofUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                      Ver comprovante
                    </a>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0 space-y-1">
                <p className="font-bold text-sm">{formatCurrency(Number(rec.amount))}</p>
                {hasAdjustment && (
                  <p className={`text-xs font-medium ${adjusted > rec.amount ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                    → {formatCurrency(adjusted)}
                  </p>
                )}
                {rec.status === "PENDENTE" && (
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => setSelected(rec)}
                      className="text-xs text-primary underline underline-offset-2 hover:text-primary/80"
                    >
                      Marcar recebido
                    </button>
                    <button
                      type="button"
                      onClick={() => setNegotiating(rec)}
                      className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                    >
                      Renegociar
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {selected && (
        <MarkPaidDialog
          open={!!selected}
          onOpenChange={(v) => { if (!v) setSelected(null) }}
          type="receivable"
          id={selected.id}
          amount={Number(selected.amount)}
          description={
            selected.customer
              ? `${selected.customer.companyName || selected.customer.tradeName || selected.customer.document}${selected.order ? ` · ${selected.order.proposal.number}` : ""}`
              : (selected.description ?? "Lançamento avulso")
          }
          bankAccounts={bankAccounts}
        />
      )}

      {negotiating && (
        <NegotiationDialog
          open={!!negotiating}
          onOpenChange={(v) => { if (!v) setNegotiating(null) }}
          id={negotiating.id}
          currentAmount={Number(negotiating.amount)}
          currentDueDate={negotiating.dueDate}
          originalAmount={negotiating.originalAmount}
          originalDueDate={negotiating.originalDueDate}
        />
      )}

      <NewAccountDialog open={newDialogOpen} onOpenChange={setNewDialogOpen} type="receivable" />
    </div>
  )
}
