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
import { renegotiateReceivable } from "@/actions/financial"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  id: string
  currentAmount: number
  currentDueDate: Date
  originalAmount?: number | null
  originalDueDate?: Date | null
}

export function NegotiationDialog({ open, onOpenChange, id, currentAmount, currentDueDate, originalAmount, originalDueDate }: Props) {
  const router = useRouter()
  const todayStr = new Date().toISOString().split("T")[0]
  const currentDueDateStr = new Date(currentDueDate).toISOString().split("T")[0]

  const [newDueDate, setNewDueDate] = useState(currentDueDateStr)
  const [newAmount, setNewAmount] = useState(currentAmount.toFixed(2).replace(".", ","))
  const [discountPct, setDiscountPct] = useState("")
  const [lateFeePerDay, setLateFeePerDay] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  function reset() {
    setNewDueDate(currentDueDateStr)
    setNewAmount(currentAmount.toFixed(2).replace(".", ","))
    setDiscountPct("")
    setLateFeePerDay("")
    setNotes("")
  }

  const parsedAmount = parseFloat(newAmount.replace(",", "."))
  const parsedDiscount = discountPct ? parseFloat(discountPct) : undefined
  const parsedLateFee = lateFeePerDay ? parseFloat(lateFeePerDay) : undefined

  const daysDiff = Math.max(0, Math.round((new Date(newDueDate + "T12:00:00").getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
  const computedLateFee = parsedLateFee && daysDiff < 0
    ? Math.abs(daysDiff) * parsedLateFee / 100 * parsedAmount
    : 0
  const computedDiscount = parsedDiscount ? parsedAmount * parsedDiscount / 100 : 0
  const finalAmount = parsedAmount + computedLateFee - computedDiscount

  async function handleSubmit() {
    if (!newDueDate || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Preencha data e valor válidos")
      return
    }
    setLoading(true)
    try {
      const result = await renegotiateReceivable(id, {
        newDueDate,
        newAmount: parsedAmount,
        discountPct: parsedDiscount,
        lateFeePerDay: parsedLateFee,
        notes: notes || undefined,
      })
      if (!result.success) {
        toast.error(result.error)
      } else {
        toast.success("Renegociação registrada com sucesso")
        reset()
        onOpenChange(false)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Renegociar recebível</DialogTitle>
          <DialogDescription>
            Altere data de vencimento, valor ou condições
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {(originalAmount || originalDueDate) && (
            <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground space-y-0.5">
              {originalAmount && <p>Valor original: {formatCurrency(originalAmount)}</p>}
              {originalDueDate && <p>Vencimento original: {formatDate(originalDueDate)}</p>}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="newDueDate">Novo vencimento *</Label>
            <Input
              id="newDueDate"
              type="date"
              value={newDueDate}
              min={todayStr}
              onChange={(e) => setNewDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newAmount">Novo valor (R$) *</Label>
            <Input
              id="newAmount"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              inputMode="decimal"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="discountPct">Desconto (%)</Label>
              <Input
                id="discountPct"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={discountPct}
                onChange={(e) => setDiscountPct(e.target.value)}
                placeholder="0.0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lateFeePerDay">Juros/dia (%)</Label>
              <Input
                id="lateFeePerDay"
                type="number"
                min={0}
                step={0.01}
                value={lateFeePerDay}
                onChange={(e) => setLateFeePerDay(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {(computedDiscount > 0 || computedLateFee > 0) && (
            <div className="rounded-md bg-muted px-3 py-2 text-xs space-y-0.5">
              {computedDiscount > 0 && (
                <p className="text-green-600 dark:text-green-400">Desconto: −{formatCurrency(computedDiscount)}</p>
              )}
              {computedLateFee > 0 && (
                <p className="text-red-600 dark:text-red-400">Juros: +{formatCurrency(computedLateFee)}</p>
              )}
              <p className="font-medium text-foreground pt-0.5">Total: {formatCurrency(finalAmount)}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="notes">Motivo / Observação</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional — registrado no histórico"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false) }} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            Confirmar renegociação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
