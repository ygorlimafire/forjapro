import { Metadata } from "next"
import { auth } from "@/lib/auth"
import { can } from "@/lib/rbac"
import { getKanbanData } from "@/actions/crm"
import { KanbanBoard } from "@/components/crm/kanban-board"
import { Target } from "lucide-react"
import { NewOpportunityDialog } from "@/components/crm/new-opportunity-dialog"
import { getCustomers } from "@/actions/customers"

const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }

export const metadata: Metadata = { title: "CRM — Funil de Vendas" }

export default async function CRMPage() {
  const [session, pipeline, customers] = await Promise.all([
    auth(),
    getKanbanData(),
    getCustomers(),
  ])
  const canDelete = session?.user ? can(session.user.permissions, "crm", "delete") : false

  if (!pipeline) {
    return (
      <div className="p-6 bg-background min-h-full">
        <div className="flex flex-col items-center justify-center py-24 gap-2 bg-white border border-[#dde0e3]">
          <Target size={32} className="text-[#dde0e3]" />
          <p style={{ ...mono, fontSize: "13px", color: "#9ba1a8" }}>Nenhum funil configurado</p>
          <p style={{ ...mono, fontSize: "11px", color: "#9ba1a8" }}>
            Execute o seed do banco de dados para criar as etapas do funil.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-background min-h-full">
      {/* ── Header ── */}
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <p style={{ ...mono, fontSize: "11px", color: "#9ba1a8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            FUNIL DE VENDAS
          </p>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "34px", color: "#16181c", lineHeight: 1, marginTop: "2px" }}>
            CRM
          </h1>
        </div>
        <NewOpportunityDialog
          stages={pipeline.stages.map((s) => ({ id: s.id, name: s.name }))}
          customers={customers.map((c) => ({
            id: c.id,
            name: c.tradeName || c.companyName || c.document,
          }))}
        />
      </div>

      <KanbanBoard
        stages={pipeline.stages.map((stage) => ({
          ...stage,
          opportunities: stage.opportunities.map((opp) => ({
            ...opp,
            value: opp.value ? Number(opp.value) : null,
          })),
        }))}
        canDelete={canDelete}
      />
    </div>
  )
}
