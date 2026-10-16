"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { saveCompanyBranding } from "@/actions/company-settings"
import { company } from "@/config/company"

const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }
const display: React.CSSProperties = { fontFamily: "'Barlow Condensed', sans-serif" }

function Field({
  label, name, value, onChange, type = "text", placeholder, required,
}: {
  label: string; name: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string; required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label style={{ ...mono, fontSize: "11px", color: "#6b7178", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="border border-[#dde0e3] bg-white px-3 py-2 text-[13px] text-[#16181c] outline-none focus:border-[--copper-600]"
        style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
      />
    </div>
  )
}

export default function OnboardingStep1() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState("")
  const [form, setForm] = useState({
    name: "", slogan: "", email: "", phone: "", cnpj: "", website: "",
    street: "", number: "", complement: "", neighborhood: "", city: "", state: "", zipCode: "",
  })

  function set(field: string) {
    return (v: string) => setForm((f) => ({ ...f, [field]: v }))
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    fd.append("bucket", "branding")
    fd.append("folder", "logos")
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    const data = await res.json()
    setUploading(false)
    if (data.url) {
      setLogoUrl(data.url)
      toast.success("Logo enviado")
    } else {
      toast.error(data.error || "Erro no upload")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) return toast.error("Nome da empresa obrigatório")
    setSaving(true)
    const result = await saveCompanyBranding({
      ...form,
      logo: logoUrl || "",
      primaryColor: company.brandColor,
    })
    setSaving(false)
    if (!result.success) {
      toast.error(result.error)
    } else {
      router.push("/onboarding/step2")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div>
        <p style={{ ...mono, fontSize: "11px", color: "#9ba1a8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          PASSO 1 DE 3
        </p>
        <h1 style={{ ...display, fontWeight: 800, fontSize: "32px", color: "#16181c", lineHeight: 1, marginTop: "4px" }}>
          Dados da Empresa
        </h1>
        <p className="text-[13px] text-[#6b7178] mt-2">
          Configure as informações básicas que aparecerão em propostas, documentos e no sistema.
        </p>
      </div>

      <div className="bg-white border border-[#dde0e3] p-5 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Nome da empresa" name="name" value={form.name} onChange={set("name")} placeholder="ex: Acme Equipamentos" required />
          </div>
          <div className="sm:col-span-2">
            <Field label="Slogan" name="slogan" value={form.slogan} onChange={set("slogan")} placeholder="ex: Qualidade que move indústrias" />
          </div>
          <Field label="E-mail" name="email" value={form.email} onChange={set("email")} type="email" placeholder="contato@empresa.com.br" />
          <Field label="Telefone" name="phone" value={form.phone} onChange={set("phone")} placeholder="(11) 9999-0000" />
          <Field label="CNPJ" name="cnpj" value={form.cnpj} onChange={set("cnpj")} placeholder="00.000.000/0001-00" />
          <Field label="Site" name="website" value={form.website} onChange={set("website")} placeholder="www.empresa.com.br" />
        </div>

        {/* Address */}
        <div className="pt-2 border-t border-[#eceef0]">
          <p style={{ ...mono, fontSize: "11px", color: "#9ba1a8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
            Endereço
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Field label="Rua" name="street" value={form.street} onChange={set("street")} />
            </div>
            <Field label="Número" name="number" value={form.number} onChange={set("number")} />
            <Field label="Complemento" name="complement" value={form.complement} onChange={set("complement")} />
            <Field label="Bairro" name="neighborhood" value={form.neighborhood} onChange={set("neighborhood")} />
            <div className="sm:col-span-2">
              <Field label="Cidade" name="city" value={form.city} onChange={set("city")} />
            </div>
            <Field label="Estado" name="state" value={form.state} onChange={set("state")} placeholder="SP" />
            <Field label="CEP" name="zipCode" value={form.zipCode} onChange={set("zipCode")} placeholder="00000-000" />
          </div>
        </div>

        {/* Logo upload */}
        <div className="pt-2 border-t border-[#eceef0]">
          <p style={{ ...mono, fontSize: "11px", color: "#9ba1a8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
            Logo
          </p>
          <div className="flex items-center gap-4">
            {logoUrl && (
              <div className="w-16 h-16 bg-[#16181c] flex items-center justify-center overflow-hidden border border-[#dde0e3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="logo" className="max-w-full max-h-full object-contain p-1" />
              </div>
            )}
            <label className="cursor-pointer">
              <span className="btn-clip inline-block px-4 py-2 text-white text-[13px]"
                style={{ ...display, fontWeight: 600, letterSpacing: "0.04em", background: "transparent" }}>
                {uploading ? "Enviando..." : "Escolher arquivo"}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
            </label>
            {logoUrl && (
              <button type="button" onClick={() => setLogoUrl("")}
                className="text-[11px] text-[#9ba1a8] hover:text-red-500 underline">
                Remover
              </button>
            )}
          </div>
          <p style={{ ...mono, fontSize: "10px", color: "#9ba1a8", marginTop: "6px" }}>
            Recomendado: PNG com fundo transparente, mín. 200×60px
          </p>
        </div>
      </div>

      <button type="submit" disabled={saving || uploading}
        className="btn-clip w-full py-3 text-white disabled:opacity-50"
        style={{ ...display, fontWeight: 700, fontSize: "16px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {saving ? "Salvando..." : "Continuar →"}
      </button>
    </form>
  )
}
