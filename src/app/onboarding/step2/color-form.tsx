"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { saveCompanyBranding } from "@/actions/company-settings"

const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }
const display: React.CSSProperties = { fontFamily: "'Barlow Condensed', sans-serif" }

const PRESETS = [
  { label: "Cobre", value: "#b5652f" },
  { label: "Aço", value: "#3b6b9e" },
  { label: "Grafite", value: "#4a5568" },
  { label: "Verde", value: "#276749" },
  { label: "Vinho", value: "#7b2d3e" },
  { label: "Âmbar", value: "#b7791f" },
]

type Props = {
  initialColor: string
  savedFields: Record<string, string>
}

export function ColorForm({ initialColor, savedFields }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [color, setColor] = useState(initialColor)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) return toast.error("Cor inválida")
    setSaving(true)
    const result = await saveCompanyBranding({ ...savedFields, primaryColor: color })
    setSaving(false)
    if (!result.success) {
      toast.error(result.error)
    } else {
      router.push("/onboarding/step3")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p style={{ ...mono, fontSize: "11px", color: "#9ba1a8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          PASSO 2 DE 3
        </p>
        <h1 style={{ ...display, fontWeight: 800, fontSize: "32px", color: "#16181c", lineHeight: 1, marginTop: "4px" }}>
          Cor da Marca
        </h1>
        <p className="text-[13px] text-[#6b7178] mt-2">
          Escolha a cor principal usada em botões, destaques e documentos.
        </p>
      </div>

      <div className="bg-white border border-[#dde0e3] p-5 space-y-5">
        <div>
          <p style={{ ...mono, fontSize: "11px", color: "#9ba1a8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
            Cores pré-definidas
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p.value} type="button" onClick={() => setColor(p.value)}
                className="flex items-center gap-2 px-3 py-1.5 border text-[12px]"
                style={{
                  borderColor: color === p.value ? p.value : "#dde0e3",
                  background: color === p.value ? p.value + "18" : "white",
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  color: "#16181c",
                }}>
                <span className="w-4 h-4 inline-block" style={{ background: p.value }} />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div>
            <p style={{ ...mono, fontSize: "11px", color: "#9ba1a8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
              Cor personalizada
            </p>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
              className="w-12 h-10 cursor-pointer border border-[#dde0e3] p-0.5" />
          </div>
          <div>
            <p style={{ ...mono, fontSize: "11px", color: "#9ba1a8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
              Código hex
            </p>
            <input type="text" value={color}
              onChange={(e) => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setColor(v) }}
              className="border border-[#dde0e3] px-3 py-2 text-[13px] w-28 outline-none focus:border-[--copper-600]"
              style={{ ...mono }} />
          </div>
        </div>

        <div className="pt-2 border-t border-[#eceef0]">
          <p style={{ ...mono, fontSize: "11px", color: "#9ba1a8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
            Pré-visualização
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            <button type="button" className="px-5 py-2 text-white text-[14px]"
              style={{ ...display, fontWeight: 700, background: color, letterSpacing: "0.04em" }}>
              APROVAR
            </button>
            <span className="px-2 py-0.5 text-[12px]"
              style={{ ...mono, color, background: color + "20", border: `1px solid ${color}40` }}>
              APROVADO
            </span>
            <div className="w-4 h-4" style={{ background: color }} />
            <span style={{ ...display, fontWeight: 700, fontSize: "20px", color }}>
              {savedFields.name || "SUA EMPRESA"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={() => router.push("/onboarding")}
          className="flex-1 py-3 border border-[#dde0e3] text-[#6b7178] text-[14px]"
          style={{ ...display, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          ← Voltar
        </button>
        <button type="submit" disabled={saving}
          className="btn-clip flex-[2] py-3 text-white disabled:opacity-50"
          style={{ ...display, fontWeight: 700, fontSize: "16px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {saving ? "Salvando..." : "Continuar →"}
        </button>
      </div>
    </form>
  )
}
