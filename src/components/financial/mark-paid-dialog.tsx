"use client"

import { useState, useRef } from "react"
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
import { Loader2, Upload, FileCheck, X } from "lucide-react"
import { markReceivableAsPaid, markPayableAsPaid } from "@/actions/financial"
import { formatCurrency } from "@/lib/utils"

const PAYMENT_METHODS = ["PIX", "TED / DOC", "Boleto", "Cartão de crédito", "Cartão de débito", "Dinheiro", "Cheque"]

type BankAccount = { id: string; name: string }

interface MarkPaidDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "receivable" | "payable"
  id: string
  amount: number
  description: string
  bankAccounts?: BankAccount[]
}

export function MarkPaidDialog({ open, onOpenChange, type, id, amount, description, bankAccounts = [] }: MarkPaidDialogProps) {
  const router = useRouter()
  const today = new Date().toISOString().split("T")[0]
  const [paidAt, setPaidAt] = useState(today)
  const [paymentMethod, setPaymentMethod] = useState("")
  const [bankAccountId, setBankAccountId] = useState("")
  const [notes, setNotes] = useState("")
  const [proofUrl, setProofUrl] = useState("")
  const [proofName, setProofName] = useState("")
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function reset() {
    setPaidAt(today)
    setPaymentMethod("")
    setBankAccountId("")
    setNotes("")
    setProofUrl("")
    setProofName("")
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("bucket", "financeiro")
      fd.append("folder", "comprovantes")

      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()

      if (!res.ok || data.error) {
        toast.error(data.error ?? "Erro no upload")
        return
      }
      setProofUrl(data.url)
      setProofName(file.name)
    } catch {
      toast.error("Erro ao enviar comprovante")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  async function handleSubmit() {
    if (!paidAt) { toast.error("Informe a data de recebimento"); return }

    setLoading(true)
    try {
      const payload = { paidAt, paymentMethod: paymentMethod || undefined, bankAccountId: bankAccountId || undefined, proofUrl: proofUrl || undefined, notes: notes || undefined }
      const result = type === "receivable"
        ? await markReceivableAsPaid(id, payload)
        : await markPayableAsPaid(id, payload)

      if (!result.success) {
        toast.error(result.error)
      } else {
        toast.success(type === "receivable" ? "Recebimento registrado!" : "Pagamento registrado!")
        reset()
        onOpenChange(false)
        router.refresh()
      }
    } catch {
      toast.error("Erro ao registrar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{type === "receivable" ? "Marcar como recebido" : "Marcar como pago"}</DialogTitle>
          <DialogDescription>
            {description} · {formatCurrency(amount)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="paidAt">
              {type === "receivable" ? "Data de recebimento *" : "Data de pagamento *"}
            </Label>
            <Input
              id="paidAt"
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              max={today}
            />
          </div>

          {type === "receivable" && (
            <div className="space-y-1.5">
              <Label htmlFor="paymentMethod">Forma de pagamento</Label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Selecionar...</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}

          {bankAccounts.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="bankAccount">Conta bancária</Label>
              <select
                id="bankAccount"
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Selecionar...</option>
                {bankAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Comprovante</Label>
            {proofUrl ? (
              <div className="flex items-center gap-2 p-2 rounded-md border bg-muted/50">
                <FileCheck size={15} className="text-green-600 shrink-0" />
                <span className="text-xs text-muted-foreground truncate flex-1">{proofName}</span>
                <button
                  type="button"
                  onClick={() => { setProofUrl(""); setProofName("") }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 h-9 rounded-md border border-dashed border-input bg-background text-sm text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? "Enviando..." : "Anexar comprovante (imagem ou PDF)"}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

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
          <Button onClick={handleSubmit} disabled={loading || !paidAt}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
