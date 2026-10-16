import { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { can } from "@/lib/rbac"
import { getCompanySettings } from "@/lib/company-settings"
import { EmpresaForm } from "@/components/configuracoes/empresa-form"

export const metadata: Metadata = { title: "Dados da Empresa" }

const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }

export default async function EmpresaPage() {
  const session = await auth()
  if (!session?.user || !can(session.user.permissions, "configuracoes", "edit")) {
    redirect("/configuracoes")
  }

  const settings = await getCompanySettings()

  return (
    <div className="p-6 bg-background min-h-full max-w-3xl space-y-6">
      <div>
        <p style={{ ...mono, fontSize: "11px", color: "#9ba1a8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          CONFIGURAÇÕES
        </p>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "34px", color: "#16181c", lineHeight: 1, marginTop: "2px" }}>
          Dados da Empresa
        </h1>
        <p className="text-[13px] text-[#6b7178] mt-1">
          Informações exibidas em propostas, documentos e no sistema.
        </p>
      </div>

      <EmpresaForm settings={settings} />
    </div>
  )
}
