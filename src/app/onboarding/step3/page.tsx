"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { completeOnboarding } from "@/actions/company-settings"
import { CheckCircle, Package, Users, ArrowRight } from "lucide-react"

const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }
const display: React.CSSProperties = { fontFamily: "'Barlow Condensed', sans-serif" }

export default function OnboardingStep3() {
  const router = useRouter()
  const [finishing, setFinishing] = useState(false)

  async function handleFinish() {
    setFinishing(true)
    const result = await completeOnboarding()
    setFinishing(false)
    if (!result.success) {
      toast.error(result.error)
    } else {
      toast.success("Configuração concluída!")
      router.push("/dashboard")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p style={{ ...mono, fontSize: "11px", color: "#9ba1a8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          PASSO 3 DE 3
        </p>
        <h1 style={{ ...display, fontWeight: 800, fontSize: "32px", color: "#16181c", lineHeight: 1, marginTop: "4px" }}>
          Pronto para Começar
        </h1>
        <p className="text-[13px] text-[#6b7178] mt-2">
          O sistema está configurado. Você pode ajustar qualquer informação depois em Configurações → Empresa.
        </p>
      </div>

      <div className="bg-white border border-[#dde0e3] p-5 space-y-4">
        <div className="flex items-start gap-3 p-3 bg-[#e3f0e6] border border-[#c5deca]">
          <CheckCircle size={18} className="text-[#3f7d4e] mt-0.5 shrink-0" />
          <div>
            <p style={{ ...display, fontWeight: 700, fontSize: "15px", color: "#3f7d4e" }}>Dados da empresa salvos</p>
            <p style={{ ...mono, fontSize: "11px", color: "#3f7d4e" }}>Nome, contato, endereço e logo configurados</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-[#e3f0e6] border border-[#c5deca]">
          <CheckCircle size={18} className="text-[#3f7d4e] mt-0.5 shrink-0" />
          <div>
            <p style={{ ...display, fontWeight: 700, fontSize: "15px", color: "#3f7d4e" }}>Cor da marca definida</p>
            <p style={{ ...mono, fontSize: "11px", color: "#3f7d4e" }}>Identidade visual aplicada ao sistema</p>
          </div>
        </div>

        <div className="pt-3 border-t border-[#eceef0]">
          <p style={{ ...display, fontWeight: 700, fontSize: "14px", color: "#16181c", marginBottom: "10px" }}>
            Próximos passos recomendados
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[13px] text-[#6b7178]">
              <Package size={14} className="text-[--copper-600]" />
              Cadastre seus fornecedores em{" "}
              <span style={{ ...mono, fontSize: "11px" }}>Fornecedores</span>
            </div>
            <div className="flex items-center gap-2 text-[13px] text-[#6b7178]">
              <Users size={14} className="text-[--copper-600]" />
              Adicione usuários da equipe em{" "}
              <span style={{ ...mono, fontSize: "11px" }}>Configurações → Usuários</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={() => router.push("/onboarding/step2")}
          className="flex-1 py-3 border border-[#dde0e3] text-[#6b7178] text-[14px]"
          style={{ ...display, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          ← Voltar
        </button>
        <button type="button" onClick={handleFinish} disabled={finishing}
          className="btn-clip flex-[2] py-3 text-white disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ ...display, fontWeight: 700, fontSize: "16px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {finishing ? "Finalizando..." : <>Acessar o Sistema <ArrowRight size={16} /></>}
        </button>
      </div>
    </div>
  )
}
