"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { saveCompanyBranding } from "@/actions/company-settings"
import type { LiveCompanySettings } from "@/lib/company-settings"

const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }
const display: React.CSSProperties = { fontFamily: "'Barlow Condensed', sans-serif" }

const COLOR_PRESETS = [
  { label: "Cobre", value: "#b5652f" },
  { label: "Aço", value: "#3b6b9e" },
  { label: "Grafite", value: "#4a5568" },
  { label: "Verde", value: "#276749" },
  { label: "Vinho", value: "#7b2d3e" },
  { label: "Âmbar", value: "#b7791f" },
]

function Field({
  label, name, value, onChange, type = "text", placeholder,
}: {
  label: string; name: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label style={{ ...mono, fontSize: "11px", color: "#6b7178", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border border-[#dde0e3] bg-white px-3 py-2 text-[13px] text-[#16181c] outline-none focus:border-[--copper-600]"
        style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
      />
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ ...mono, fontSize: "11px", color: "#9ba1a8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
      {children}
    </p>
  )
}

export function EmpresaForm({ settings }: { settings: LiveCompanySettings }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState(settings.logo ?? "")
  const [color, setColor] = useState(settings.primaryColor)
  const [minMargin, setMinMargin] = useState(String(settings.minMarginPct))
  const [form, setForm] = useState({
    name: settings.name,
    slogan: settings.slogan ?? "",
    email: settings.email ?? "",
    phone: settings.phone ?? "",
    cnpj: settings.cnpj ?? "",
    website: settings.website ?? "",
    street: settings.street ?? "",
    number: settings.number ?? "",
    complement: settings.complement ?? "",
    neighborhood: settings.neighborhood ?? "",
    city: settings.city ?? "",
    state: settings.state ?? "",
    zipCode: settings.zipCode ?? "",
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
    if (data.url) { setLogoUrl(data.url); toast.success("Logo atualizado") }
    else toast.error(data.error || "Erro no upload")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) return toast.error("Nome da empresa obrigatório")
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) return toast.error("Cor inválida")
    setSaving(true)
    const result = await saveCompanyBranding({ ...form, logo: logoUrl, primaryColor: color, minMarginPct: Number(minMargin) })
    setSaving(false)
    if (!result.success) {
      toast.error(result.error)
    } else {
      toast.success("Configurações salvas")
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Identidade */}
      <div className="bg-white border border-[#dde0e3] p-[22px]">
        <h2 style={{ ...display, fontWeight: 700, fontSize: "16px", color: "#16181c", textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: "16px" }}>
          Identidade
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Nome da empresa *" name="name" value={form.name} onChange={set("name")} placeholder="ex: Acme Equipamentos" />
          </div>
          <div className="sm:col-span-2">
            <Field label="Slogan" name="slogan" value={form.slogan} onChange={set("slogan")} placeholder="ex: Qualidade que move indústrias" />
          </div>
        </div>

        {/* Logo */}
        <div className="mt-4 pt-4 border-t border-[#eceef0]">
          <SectionTitle>Logo</SectionTitle>
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
                {uploading ? "Enviando..." : logoUrl ? "Trocar logo" : "Escolher arquivo"}
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
            PNG com fundo transparente, mín. 200×60px
          </p>
        </div>

        {/* Color */}
        <div className="mt-4 pt-4 border-t border-[#eceef0]">
          <SectionTitle>Cor da marca</SectionTitle>
          <div className="flex flex-wrap gap-2 mb-3">
            {COLOR_PRESETS.map((p) => (
              <button key={p.value} type="button" onClick={() => setColor(p.value)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 border text-[12px]"
                style={{
                  borderColor: color === p.value ? p.value : "#dde0e3",
                  background: color === p.value ? p.value + "18" : "white",
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  color: "#16181c",
                }}>
                <span className="w-3.5 h-3.5 inline-block" style={{ background: p.value }} />
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
              className="w-10 h-9 cursor-pointer border border-[#dde0e3] p-0.5" />
            <input type="text" value={color}
              onChange={(e) => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setColor(v) }}
              className="border border-[#dde0e3] px-3 py-2 text-[13px] w-28 outline-none focus:border-[--copper-600]"
              style={{ ...mono }} />
          </div>
        </div>
      </div>

      {/* Contato */}
      <div className="bg-white border border-[#dde0e3] p-[22px]">
        <h2 style={{ ...display, fontWeight: 700, fontSize: "16px", color: "#16181c", textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: "16px" }}>
          Contato
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="E-mail" name="email" value={form.email} onChange={set("email")} type="email" placeholder="contato@empresa.com.br" />
          <Field label="Telefone" name="phone" value={form.phone} onChange={set("phone")} placeholder="(11) 9999-0000" />
          <Field label="CNPJ" name="cnpj" value={form.cnpj} onChange={set("cnpj")} placeholder="00.000.000/0001-00" />
          <Field label="Site" name="website" value={form.website} onChange={set("website")} placeholder="www.empresa.com.br" />
        </div>
      </div>

      {/* Comercial */}
      <div className="bg-white border border-[#dde0e3] p-[22px]">
        <h2 style={{ ...display, fontWeight: 700, fontSize: "16px", color: "#16181c", textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: "16px" }}>
          Parâmetros Comerciais
        </h2>
        <div className="flex flex-col gap-1 max-w-[180px]">
          <label style={{ ...mono, fontSize: "11px", color: "#6b7178", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Margem mínima (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={minMargin}
            onChange={(e) => setMinMargin(e.target.value)}
            className="border border-[#dde0e3] bg-white px-3 py-2 text-[13px] text-[#16181c] outline-none focus:border-[--copper-600]"
            style={{ ...mono }}
          />
          <p style={{ ...mono, fontSize: "10px", color: "#9ba1a8", marginTop: "2px" }}>
            Propostas abaixo dessa margem exibem alerta
          </p>
        </div>
      </div>

      {/* Endereço */}
      <div className="bg-white border border-[#dde0e3] p-[22px]">
        <h2 style={{ ...display, fontWeight: 700, fontSize: "16px", color: "#16181c", textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: "16px" }}>
          Endereço
        </h2>
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

      <button type="submit" disabled={saving || uploading}
        className="btn-clip px-8 py-3 text-white disabled:opacity-50"
        style={{ ...display, fontWeight: 700, fontSize: "15px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {saving ? "Salvando..." : "Salvar Configurações"}
      </button>
    </form>
  )
}
