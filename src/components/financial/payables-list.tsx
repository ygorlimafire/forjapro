"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { formatCurrency, formatDate } from "@/lib/utils"
import { MarkPaidDialog } from "./mark-paid-dialog"
import { NewAccountDialog } from "./new-account-dialog"
import { updatePayableExpenseCategory } from "@/actions/financial"
import { CsvExportButton } from "./csv-export-button"
import { CheckCircle2, AlertTriangle, Clock, XCircle, FileText, ExternalLink, Pencil, Check, Plus, RefreshCw } from "lucide-react"
import type { PayableStatus } from "@prisma/client"

type ExpenseCategory = { id: string; name: string; color: string }
type Supplier = { id: string; companyName: string; tradeName: string | null }

type Payable = {
  id: string
  amount: number
  dueDate: Date
  status: PayableStatus
  paidAt: Date | null
  category: string | null
  proofUrl: string | null
  notes: string | null
  description: string | null
  isRecurring: boolean
  installment: number
  totalInstallments: number
  supplier: { id: string; companyName: string; tradeName: string | null } | null
  purchaseOrder: { id: string; number: string } | null
  expenseCategory: { id: string; name: string; color: string } | null
}

type BankAccount = { id: string; name: string }

interface Props {
  payables: Payable[]
  bankAccounts?: BankAccount[]
  expenseCategories?: ExpenseCategory[]
  suppliers?: Supplier[]
}

const STATUS_CONFIG: Record<PayableStatus, { label: string; className: string; icon: React.ReactNode }> = {
  PENDENTE: {
    label: "A pagar",
    className: "text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950/30 dark:border-yellow-900/50",
    icon: <Clock size={11} />,
  },
  PAGO: {
    label: "Pago",
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

function CategoryCell({ payable, categories }: { payable: Payable; categories: ExpenseCategory[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(payable.expenseCategory?.id ?? "")
  const [saving, setSaving] = useState(false)

  const current = categories.find((c) => c.id === value) ?? payable.expenseCategory

  async function save() {
    if (value === (payable.expenseCategory?.id ?? "")) { setEditing(false); return }
    if (!value) { setEditing(false); return }
    setSaving(true)
    const result = await updatePayableExpenseCategory(payable.id, value)
    setSaving(false)
    if (result.success) {
      setEditing(false)
      router.refresh()
    } else {
      toast.error(result.error)
      setValue(payable.expenseCategory?.id ?? "")
    }
  }

  if (categories.length === 0) {
    const label = payable.expenseCategory?.name ?? payable.category ?? ""
    if (!label) return null
    return <span className="text-xs text-muted-foreground">{label}</span>
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="group flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        {current && (
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: current.color }} />
        )}
        <span>{current?.name ?? payable.category ?? "Categoria"}</span>
        <Pencil size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-6 rounded border border-input bg-background px-1.5 text-xs focus:outline-none"
        autoFocus
        disabled={saving}
      >
        <option value="">Selecione...</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <button type="button" onClick={save} disabled={saving} className="text-green-600 hover:text-green-700">
        <Check size={12} />
      </button>
    </div>
  )
}

export function PayablesList({ payables, bankAccounts = [], expenseCategories = [], suppliers = [] }: Props) {
  const [selected, setSelected] = useState<Payable | null>(null)
  const [newDialogOpen, setNewDialogOpen] = useState(false)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const totalPending = payables
    .filter((p) => p.status === "PENDENTE")
    .reduce((s, p) => s + Number(p.amount), 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        {totalPending > 0 ? (
          <>
            <p className="text-xs text-muted-foreground">{payables.length} conta{payables.length !== 1 ? "s" : ""}</p>
            <p className="text-xs text-muted-foreground">
              A pagar: <span className="font-semibold text-foreground">{formatCurrency(totalPending)}</span>
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">{payables.length} conta{payables.length !== 1 ? "s" : ""}</p>
        )}
        <div className="flex items-center gap-3">
          <CsvExportButton
            data={payables.map((p) => ({
              fornecedor: p.supplier ? (p.supplier.tradeName || p.supplier.companyName) : (p.description ?? ""),
              categoria: p.expenseCategory?.name ?? p.category ?? "",
              valor: Number(p.amount),
              vencimento: new Date(p.dueDate),
              status: p.status,
              pago_em: p.paidAt ? new Date(p.paidAt) : null,
              notas: p.notes ?? "",
            }))}
            columns={[
              { key: "fornecedor", label: "Fornecedor/Descrição" },
              { key: "categoria", label: "Categoria" },
              { key: "valor", label: "Valor" },
              { key: "vencimento", label: "Vencimento" },
              { key: "status", label: "Status" },
              { key: "pago_em", label: "Pago em" },
              { key: "notas", label: "Observações" },
            ]}
            filename="contas-a-pagar.csv"
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

      {payables.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText size={36} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma conta a pagar encontrada</p>
        </div>
      )}

      <div className="space-y-2">
        {payables.map((p) => {
          const isOverdue = p.status === "PENDENTE" && new Date(p.dueDate) < today
          const supplierName = p.supplier
            ? (p.supplier.tradeName || p.supplier.companyName)
            : (p.description ?? p.expenseCategory?.name ?? p.category ?? "")
          const config = isOverdue ? STATUS_CONFIG.VENCIDO : STATUS_CONFIG[p.status]

          return (
            <div
              key={p.id}
              className={`flex items-center gap-4 p-4 rounded-xl border bg-card ${isOverdue ? "border-red-200 dark:border-red-900/50" : ""}`}
            >
              {/* Category color bar */}
              {p.expenseCategory && (
                <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: p.expenseCategory.color }} />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
                    {config.icon}
                    {isOverdue ? "Vencido" : config.label}
                  </span>
                  {p.isRecurring && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                      <RefreshCw size={10} />
                      Recorrente
                    </span>
                  )}
                  {p.totalInstallments > 1 && (
                    <span className="text-xs text-muted-foreground">
                      {p.installment}/{p.totalInstallments}
                    </span>
                  )}
                  {p.purchaseOrder && (
                    <Link
                      href={`/compras/${p.purchaseOrder.id}`}
                      className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
                    >
                      {p.purchaseOrder.number}
                      <ExternalLink size={10} className="ml-0.5" />
                    </Link>
                  )}
                  <CategoryCell payable={p} categories={expenseCategories} />
                </div>
                <p className="text-sm font-medium">{supplierName}</p>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                  <span>Vence: {formatDate(p.dueDate)}</span>
                  {p.paidAt && <span>Pago: {formatDate(p.paidAt)}</span>}
                  {p.proofUrl && (
                    <a href={p.proofUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                      Ver comprovante
                    </a>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0 space-y-1">
                <p className="font-bold text-sm">{formatCurrency(Number(p.amount))}</p>
                {p.status === "PENDENTE" && (
                  <button
                    type="button"
                    onClick={() => setSelected(p)}
                    className="text-xs text-primary underline underline-offset-2 hover:text-primary/80"
                  >
                    Marcar pago
                  </button>
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
          type="payable"
          id={selected.id}
          amount={Number(selected.amount)}
          description={
            selected.supplier
              ? `${selected.supplier.tradeName || selected.supplier.companyName}${selected.purchaseOrder ? ` · ${selected.purchaseOrder.number}` : ""}`
              : (selected.description ?? selected.expenseCategory?.name ?? selected.category ?? "Conta a pagar")
          }
          bankAccounts={bankAccounts}
        />
      )}

      <NewAccountDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        type="payable"
        expenseCategories={expenseCategories}
        suppliers={suppliers}
      />
    </div>
  )
}
