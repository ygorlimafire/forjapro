"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createSupplier, updateSupplier } from "@/actions/suppliers"
import { Loader2, Save } from "lucide-react"
import type { Supplier } from "@prisma/client"

const SUPPLIER_TYPES = [
  { value: "PRODUTO", label: "Fornecedor de Produtos" },
  { value: "SERVICO", label: "Prestador de Serviços" },
  { value: "DESPESA_FIXA", label: "Despesa Fixa" },
  { value: "OUTRO", label: "Outro" },
]

const CURRENCIES = [
  { value: "BRL", label: "BRL — Real" },
  { value: "USD", label: "USD — Dólar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "CNY", label: "CNY — Yuan" },
  { value: "GBP", label: "GBP — Libra" },
]

const PAYMENT_METHODS = [
  { value: "", label: "Selecione..." },
  { value: "PIX", label: "PIX" },
  { value: "BOLETO", label: "Boleto" },
  { value: "TRANSFERENCIA", label: "Transferência" },
  { value: "CARTAO", label: "Cartão" },
  { value: "SWIFT", label: "SWIFT (Internacional)" },
  { value: "CHEQUE", label: "Cheque" },
]

interface SupplierFormProps {
  supplier?: Supplier
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${className}`}
      {...props}
    />
  )
}

function Select({ className = "", children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none ${className}`}
      {...props}
    />
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-foreground border-b pb-2 mb-4">{children}</h3>
}

export function SupplierForm({ supplier }: SupplierFormProps) {
  const router = useRouter()
  const isEdit = !!supplier
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    type: supplier?.type ?? "PRODUTO",
    companyName: supplier?.companyName ?? "",
    tradeName: supplier?.tradeName ?? "",
    document: supplier?.document ?? "",
    taxId: supplier?.taxId ?? "",
    country: supplier?.country ?? "BR",
    contactName: supplier?.contactName ?? "",
    phone: supplier?.phone ?? "",
    email: supplier?.email ?? "",
    site: supplier?.site ?? "",
    street: supplier?.street ?? "",
    number: supplier?.number ?? "",
    complement: supplier?.complement ?? "",
    neighborhood: supplier?.neighborhood ?? "",
    city: supplier?.city ?? "",
    state: supplier?.state ?? "",
    zipCode: supplier?.zipCode ?? "",
    preferredPayment: supplier?.preferredPayment ?? "",
    currency: supplier?.currency ?? "BRL",
    bank: supplier?.bank ?? "",
    bankAgency: supplier?.bankAgency ?? "",
    bankAccount: supplier?.bankAccount ?? "",
    bankIban: supplier?.bankIban ?? "",
    pixKey: supplier?.pixKey ?? "",
    avgLeadDays: supplier?.avgLeadDays?.toString() ?? "",
    avgPaymentDays: supplier?.avgPaymentDays?.toString() ?? "",
    volumeDiscountPct: supplier?.volumeDiscountPct != null ? String(supplier.volumeDiscountPct) : "",
    commercialTerms: supplier?.commercialTerms ?? "",
    notes: supplier?.notes ?? "",
    isActive: supplier?.isActive ?? true,
  })

  function set(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const payload = {
      ...form,
      avgLeadDays: form.avgLeadDays ? parseInt(form.avgLeadDays) : null,
      avgPaymentDays: form.avgPaymentDays ? parseInt(form.avgPaymentDays) : null,
      volumeDiscountPct: form.volumeDiscountPct ? parseFloat(form.volumeDiscountPct) : null,
    }

    const result = isEdit
      ? await updateSupplier(supplier!.id, payload)
      : await createSupplier(payload)

    setSaving(false)

    if (result.success) {
      toast.success(isEdit ? "Fornecedor atualizado" : "Fornecedor cadastrado com sucesso")
      router.push("/fornecedores")
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Identificação */}
      <div>
        <SectionTitle>Identificação</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tipo *">
            <Select value={form.type} onChange={(e) => set("type", e.target.value)}>
              {SUPPLIER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Moeda">
            <Select value={form.currency} onChange={(e) => set("currency", e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Razão Social *">
            <Input value={form.companyName} onChange={(e) => set("companyName", e.target.value)} required />
          </Field>
          <Field label="Nome Fantasia / Apelido">
            <Input value={form.tradeName} onChange={(e) => set("tradeName", e.target.value)} />
          </Field>
          <Field label="CNPJ / CPF">
            <Input value={form.document} onChange={(e) => set("document", e.target.value)} placeholder="00.000.000/0001-00" />
          </Field>
          <Field label="Tax ID / VAT (internacional)">
            <Input value={form.taxId} onChange={(e) => set("taxId", e.target.value)} placeholder="Para fornecedores estrangeiros" />
          </Field>
          <Field label="País">
            <Input value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="BR" maxLength={2} />
          </Field>
        </div>
      </div>

      {/* Contato */}
      <div>
        <SectionTitle>Contato</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome do contato">
            <Input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} />
          </Field>
          <Field label="Telefone / WhatsApp">
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} type="tel" />
          </Field>
          <Field label="E-mail">
            <Input value={form.email} onChange={(e) => set("email", e.target.value)} type="email" />
          </Field>
          <Field label="Site">
            <Input value={form.site} onChange={(e) => set("site", e.target.value)} placeholder="www.exemplo.com" />
          </Field>
        </div>
      </div>

      {/* Endereço */}
      <div>
        <SectionTitle>Endereço</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="CEP">
            <Input value={form.zipCode} onChange={(e) => set("zipCode", e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Rua / Avenida">
              <Input value={form.street} onChange={(e) => set("street", e.target.value)} />
            </Field>
          </div>
          <Field label="Número">
            <Input value={form.number} onChange={(e) => set("number", e.target.value)} />
          </Field>
          <Field label="Complemento">
            <Input value={form.complement} onChange={(e) => set("complement", e.target.value)} />
          </Field>
          <Field label="Bairro">
            <Input value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
          </Field>
          <Field label="Cidade">
            <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
          </Field>
          <Field label="Estado">
            <Input value={form.state} onChange={(e) => set("state", e.target.value)} maxLength={2} placeholder="SP" />
          </Field>
        </div>
      </div>

      {/* Dados bancários */}
      <div>
        <SectionTitle>Dados Bancários / Pagamento</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Forma preferida de pagamento">
            <Select value={form.preferredPayment} onChange={(e) => set("preferredPayment", e.target.value)}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Chave PIX">
            <Input value={form.pixKey} onChange={(e) => set("pixKey", e.target.value)} />
          </Field>
          <Field label="Banco">
            <Input value={form.bank} onChange={(e) => set("bank", e.target.value)} />
          </Field>
          <Field label="Agência">
            <Input value={form.bankAgency} onChange={(e) => set("bankAgency", e.target.value)} />
          </Field>
          <Field label="Conta">
            <Input value={form.bankAccount} onChange={(e) => set("bankAccount", e.target.value)} />
          </Field>
          <Field label="IBAN / SWIFT (internacional)">
            <Input value={form.bankIban} onChange={(e) => set("bankIban", e.target.value)} />
          </Field>
        </div>
      </div>

      {/* Condições comerciais */}
      <div>
        <SectionTitle>Condições Comerciais</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Prazo de entrega médio (dias)">
            <Input
              type="number"
              min={0}
              value={form.avgLeadDays}
              onChange={(e) => set("avgLeadDays", e.target.value)}
              placeholder="30"
            />
          </Field>
          <Field label="Prazo de pagamento médio (dias)">
            <Input
              type="number"
              min={0}
              value={form.avgPaymentDays}
              onChange={(e) => set("avgPaymentDays", e.target.value)}
              placeholder="28"
            />
          </Field>
          <Field label="Desconto por volume (%)">
            <Input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={form.volumeDiscountPct}
              onChange={(e) => set("volumeDiscountPct", e.target.value)}
              placeholder="0.0"
            />
          </Field>
          <div className="sm:col-span-3">
            <Field label="Termos comerciais">
              <Textarea
                rows={3}
                value={form.commercialTerms}
                onChange={(e) => set("commercialTerms", e.target.value)}
                placeholder="Condições de pagamento, frete, etc."
              />
            </Field>
          </div>
          <div className="sm:col-span-3">
            <Field label="Observações internas">
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </Field>
          </div>
        </div>
      </div>

      {isEdit && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Ativo</label>
          <button
            type="button"
            role="switch"
            aria-checked={form.isActive}
            onClick={() => set("isActive", !form.isActive)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.isActive ? "bg-primary" : "bg-input"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.isActive ? "translate-x-4" : "translate-x-0.5"}`} />
          </button>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-9 px-4 text-sm rounded-md border border-input bg-background hover:bg-muted transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="h-9 px-4 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {isEdit ? "Salvar alterações" : "Cadastrar fornecedor"}
        </button>
      </div>
    </form>
  )
}
