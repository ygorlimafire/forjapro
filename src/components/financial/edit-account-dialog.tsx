"use client"

import { useState, useEffect } from "react"
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
import { updateReceivable, updatePayable } from "@/actions/financial"

type ExpenseCategory = { id: string; name: string; color: string }

interface ReceivableItem {
  id: string
  description: string | null
  amount: number
  dueDate: Date
  notes: string | null
}

interface PayableItem {
  id: string
  description: string | null
  amount: number
  dueDate: Date
  notes: string | null
  expenseCategory: { id: string; name: string; color: string } | null
}

interface ReceivableProps {
  type: "receivable"
  item: ReceivableItem
  open: boolean
  onOpenChange: (open: boolean) => void
  expenseCategories?: ExpenseCategory[]
}

interface PayableProps {
  type: "payable"
  item: PayableItem
  open: boolean
  onOpenChange: (open: boolean) => void
  expenseCategories?: ExpenseCategory[]
}

type Props = ReceivableProps | PayableProps

function toDateInput(d: Date): string {
  return new Date(d).toISOString().split("T")[0]
}

export function EditAccountDialog({ type, item, open, onOpenChange, expenseCategories = [] }: Props) {
  const router = useRouter()
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setDescription(item.description ?? "")
      setAmount(String(item.amount))
      setDueDate(toDateInput(item.dueDate))
      setNotes(item.notes ?? "")
      setCategoryId(type === "payable" ? ((item as PayableItem).expenseCategory?.id ?? "") : "")
    }
  }, [open, item, type])

  async function handleSubmit() {
    const amountNum = parseFloat(amount.replace(",", "."))
    if (isNaN(amountNum) || amountNum <= 0 || !dueDate) {
      toast.error("Preencha valor e data corretamente")
      return
    }

    setLoading(true)
    try {
      const result = type === "receivable"
        ? await updateReceivable(item.id, { description: description || undefined, amount: amountNum, dueDate, notes: notes || undefined })
        : await updatePayable(item.id, { description: description || undefined, amount: amountNum, dueDate, categoryId: categoryId || undefined, notes: notes || undefined })

      if (!result.success) {
        toast.error(result.error)
      } else {
        toast.success("Conta atualizada!")
        onOpenChange(false)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{type === "receivable" ? "Editar conta a receber" : "Editar conta a pagar"}</DialogTitle>
          <DialogDescription>Altere os campos desejados e salve.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-desc">Descrição</Label>
            <Input
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-amount">Valor (R$) *</Label>
              <Input
                id="edit-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                inputMode="decimal"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-due">Vencimento *</Label>
              <Input
                id="edit-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {type === "payable" && expenseCategories.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="edit-cat">Categoria de despesa</Label>
              <div className="flex items-center gap-2">
                {categoryId && (
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: expenseCategories.find((c) => c.id === categoryId)?.color }}
                  />
                )}
                <select
                  id="edit-cat"
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

          <div className="space-y-1.5">
            <Label htmlFor="edit-notes">Observações</Label>
            <Input
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
