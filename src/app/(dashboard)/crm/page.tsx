import { Metadata } from "next"
import { getKanbanData } from "@/actions/crm"
import { KanbanBoard } from "@/components/crm/kanban-board"
import { Card, CardContent } from "@/components/ui/card"
import { Target } from "lucide-react"
import { NewOpportunityDialog } from "@/components/crm/new-opportunity-dialog"
import { getCustomers } from "@/actions/customers"

export const metadata: Metadata = { title: "CRM — Funil de Vendas" }

export default async function CRMPage() {
  const [pipeline, customers] = await Promise.all([
    getKanbanData(),
    getCustomers(),
  ])

  if (!pipeline) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-16 text-center">
            <Target size={40} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">Nenhum funil configurado</p>
            <p className="text-sm text-muted-foreground mt-1">
              O seed do banco de dados precisa ser executado para criar as etapas do funil.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Target size={22} /> CRM — {pipeline.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie o funil de vendas arrastando as oportunidades entre as etapas
          </p>
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
      />
    </div>
  )
}
