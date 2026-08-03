"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { createReceivable, createPayable } from "@/actions/financial"

type ExpenseCategory = { id: string; name: string; color: string }
type Supplier = { id: string; companyName: string; tradeName: string | null }

const COST_CENTERS = [
  { value: "", label: "Nenhum" },
  { value: "COMERCIAL", label: "Comercial" },
  { value: "ADMINISTRATIVO", label: "Administrativo" },
  { value: "OPERACIONAL", label: "Operacional" },
]

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + "T12:00:00")
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split("T")[0]
}

function buildInstallmentDates(baseDate: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addMonths(baseDate, i))
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "receivable" | "payable"
  expenseCategories?: ExpenseCategory[]
  suppliers?: Supplier[]
}

export function NewAccountDialog({ open, onOpenChange, type, expenseCategories = [], suppliers = [] }: Props) {
  const router = useRouter()
  const today = new Date().toISOString().split("T")[0]
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [dueDate, setDueDate] = useState(today)
  const [installmentDates, setInstallmentDates] = useState<string[]>([])
  const [categoryId, setCategoryId] = useState("")
  const [supplierId, setSupplierId] = useState("")
  const [installments, setInstallments] = useState("1")
  const [isRecurring, setIsRecurring] = useState(false)
  const [costCenter, setCostCenter] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  function reset() {
    setDescription("")
    setAmount("")
    setDueDate(today)
    setInstallmentDates([])
    setCategoryId("")
    setSupplierId("")
    setInstallments("1")
    setIsRecurring(false)
    setCostCenter("")
    setNotes("")
  }

  function handleInstallmentsChange(val: string) {
    setInstallments(val)
    const n = parseInt(val) || 1
    if (n > 1) {
      setIsRecurring(false)
      setInstallmentDates(buildInstallmentDates(dueDate, n))
    } else {
      setInstallmentDates([])
    }
  }

  function handleDueDateChange(val: string) {
    setDueDate(val)
    if (installmentDates.length > 1 && val) {
      setInstallmentDates(buildInstallmentDates(val, installmentDates.length))
    }
  }

  function handleInstallmentDateChange(index: number, val: string) {
    setInstallmentDates((prev) => prev.map((d, i) => (i === index ? val : d)))
  }

  async function handleSubmit() {
    const amountNum = parseFloat(amount.replace(",", "."))
    const installmentsNum = parseInt(installments) || 1
    const activeDueDate = installmentsNum > 1 ? (installmentDates[0] ?? dueDate) : dueDate

    if (isNaN(amountNum) || amountNum <= 0 || !activeDueDate) {
      toast.error("Preencha todos os campos obrigatórios com valores válidos")
      return
    }

    if (installmentsNum > 1 && installmentDates.some((d) => !d)) {
      toast.error("Preencha todas as datas de vencimento das parcelas")
      return
    }

    if (type === "receivable" && !description) {
      toast.error("Descrição obrigatória")
      return
    }

    setLoading(true)
    try {
      let result
      if (type === "receivable") {
        result = await createReceivable({ description, amount: amountNum, dueDate: activeDueDate, notes: notes || undefined })
      } else {
        result = await createPayable({
          description: description || undefined,
          amount: amountNum,
          dueDate: activeDueDate,
          categoryId: categoryId || undefined,
          supplierId: supplierId || undefined,
          installments: installmentsNum,
          isRecurring,
          costCenter: costCenter || undefined,
          notes: notes || undefined,
          dueDates: installmentsNum > 1 ? installmentDates : undefined,
        })
      }

      if (!result.success) {
        toast.error(result.error)
      } else {
        toast.success(
          type === "receivable"
            ? "Conta a receber criada!"
            : installmentsNum > 1
              ? `${installmentsNum} parcelas criadas com sucesso!`
              : isRecurring
                ? "Conta recorrente criada!"
                : "Conta a pagar criada!"
        )
        reset()
        onOpenChange(false)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const installmentsNum = parseInt(installments) || 1

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{type === "receivable" ? "Nova conta a receber" : "Nova conta a pagar"}</DialogTitle>
          <DialogDescription>
            {type === "receivable" ? "Lançamento manual de recebimento avulso" : "Lançamento manual de despesa"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Supplier (payable only) */}
          {type === "payable" && suppliers.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="supplierId">Fornecedor / Prestador</Label>
              <select
                id="supplierId"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Nenhum (avulso)</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.tradeName || s.companyName}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="description">{type === "receivable" ? "Descrição *" : "Descrição"}</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === "receivable" ? "Ex: Consultoria, Taxa de serviço..." : "Ex: Aluguel, Conta de luz..."}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Valor (R$) *</Label>
              <Input
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                inputMode="decimal"
              />
            </div>
            {/* Single due date — only shown when installments = 1 */}
            {installmentsNum <= 1 && (
              <div className="space-y-1.5">
                <Label htmlFor="dueDate">Vencimento *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => handleDueDateChange(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Category (payable only) */}
          {type === "payable" && expenseCategories.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="categoryId">Categoria de despesa</Label>
              <div className="flex items-center gap-2">
                {categoryId && (
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: expenseCategories.find((c) => c.id === categoryId)?.color }}
                  />
                )}
                <select
                  id="categoryId"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Sem categoria</option>
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Installments + Recurring (payable only) */}
          {type === "payable" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="installments">Parcelas</Label>
                <Input
                  id="installments"
                  type="number"
                  min={1}
                  max={60}
                  value={installments}
                  onChange={(e) => handleInstallmentsChange(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="costCenter">Centro de custo</Label>
                <select
                  id="costCenter"
                  value={costCenter}
                  onChange={(e) => setCostCenter(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {COST_CENTERS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Per-installment due dates (payable, N > 1) */}
          {type === "payable" && installmentsNum > 1 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Datas de vencimento — edite livremente, sugestão +30 dias
              </Label>
              <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                {installmentDates.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-16 shrink-0">
                      Parcela {i + 1}/{installmentsNum}
                    </span>
                    <Input
                      type="date"
                      value={d}
                      onChange={(e) => handleInstallmentDateChange(i, e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recurring toggle (payable, 1 installment only) */}
          {type === "payable" && installmentsNum <= 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                role="switch"
                aria-checked={isRecurring}
                onClick={() => setIsRecurring(!isRecurring)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isRecurring ? "bg-primary" : "bg-input"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isRecurring ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
              <Label className="text-sm font-normal cursor-pointer" onClick={() => setIsRecurring(!isRecurring)}>
                Recorrente mensal <span className="text-xs text-muted-foreground">(repete ao marcar pago)</span>
              </Label>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="notes">Observações</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false) }} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            {installmentsNum > 1 ? `Criar ${installmentsNum} parcelas` : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
