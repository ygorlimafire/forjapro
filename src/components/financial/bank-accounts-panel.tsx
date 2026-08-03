"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"
import { createBankAccount, updateBankAccount, deactivateBankAccount } from "@/actions/bank-accounts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Pencil, Trash2, Plus, Loader2, Landmark, Wallet, Banknote } from "lucide-react"
import type { BankAccountType } from "@prisma/client"

type BankAccountWithBalance = {
  id: string
  name: string
  type: BankAccountType
  initialBalance: number
  currentBalance: number
  isActive: boolean
}

interface Props {
  accounts: BankAccountWithBalance[]
}

const TYPE_LABELS: Record<BankAccountType, string> = {
  CONTA_CORRENTE: "Conta corrente",
  POUPANCA: "Poupança",
  CAIXA: "Caixa",
}

const TYPE_ICONS: Record<BankAccountType, React.ReactNode> = {
  CONTA_CORRENTE: <Landmark size={14} />,
  POUPANCA: <Banknote size={14} />,
  CAIXA: <Wallet size={14} />,
}

interface FormState {
  name: string
  type: BankAccountType
  initialBalance: string
}

const DEFAULT_FORM: FormState = { name: "", type: "CONTA_CORRENTE", initialBalance: "0" }

export function BankAccountsPanel({ accounts }: Props) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<BankAccountWithBalance | null>(null)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [loading, setLoading] = useState(false)

  function openNew() {
    setEditing(null)
    setForm(DEFAULT_FORM)
    setDialogOpen(true)
  }

  function openEdit(acc: BankAccountWithBalance) {
    setEditing(acc)
    setForm({
      name: acc.name,
      type: acc.type,
      initialBalance: acc.initialBalance.toFixed(2).replace(".", ","),
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    const initialBalance = parseFloat(form.initialBalance.replace(",", "."))
    if (!form.name || isNaN(initialBalance)) {
      toast.error("Preencha nome e saldo inicial")
      return
    }

    setLoading(true)
    try {
      const payload = { name: form.name, type: form.type, initialBalance }
      const result = editing
        ? await updateBankAccount(editing.id, payload)
        : await createBankAccount(payload)

      if (!result.success) {
        toast.error(result.error)
      } else {
        toast.success(editing ? "Conta atualizada!" : "Conta criada!")
        setDialogOpen(false)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDeactivate(acc: BankAccountWithBalance) {
    if (!confirm(`Desativar "${acc.name}"?`)) return
    const result = await deactivateBankAccount(acc.id)
    if (!result.success) {
      toast.error(result.error)
    } else {
      toast.success("Conta desativada")
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{accounts.length} conta{accounts.length !== 1 ? "s" : ""} bancária{accounts.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={openNew}>
          <Plus size={14} className="mr-1" /> Nova conta
        </Button>
      </div>

      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Landmark size={36} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma conta bancária cadastrada</p>
          <p className="text-xs text-muted-foreground mt-1">Crie contas para vincular recebimentos e pagamentos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {accounts.map((acc) => (
            <div key={acc.id} className="flex items-center gap-4 p-4 rounded-xl border bg-card">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-muted-foreground">{TYPE_ICONS[acc.type]}</span>
                  <p className="text-sm font-medium">{acc.name}</p>
                  <span className="text-xs text-muted-foreground">· {TYPE_LABELS[acc.type]}</span>
                </div>
                <p className="text-xs text-muted-foreground">Saldo inicial: {formatCurrency(acc.initialBalance)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`font-bold text-sm ${acc.currentBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {formatCurrency(acc.currentBalance)}
                </p>
                <p className="text-xs text-muted-foreground">saldo atual</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button type="button" onClick={() => openEdit(acc)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                  <Pencil size={13} />
                </button>
                <button type="button" onClick={() => handleDeactivate(acc)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar conta" : "Nova conta bancária"}</DialogTitle>
            <DialogDescription>
              {editing ? "Altere os dados da conta bancária" : "Adicione uma conta para controle de saldos"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="acc-name">Nome *</Label>
              <Input
                id="acc-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Bradesco CC, Caixa físico..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="acc-type">Tipo</Label>
              <select
                id="acc-type"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as BankAccountType }))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="CONTA_CORRENTE">Conta corrente</option>
                <option value="POUPANCA">Poupança</option>
                <option value="CAIXA">Caixa</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="acc-balance">Saldo inicial (R$)</Label>
              <Input
                id="acc-balance"
                value={form.initialBalance}
                onChange={(e) => setForm((f) => ({ ...f, initialBalance: e.target.value }))}
                placeholder="0,00"
                inputMode="decimal"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 size={14} className="animate-spin" />}
              {editing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
