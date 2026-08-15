"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core"
import { toast } from "sonner"
import { moveOpportunityStage } from "@/actions/crm"
import { KanbanColumn } from "./kanban-column"
import { KanbanCard } from "./kanban-card"
import { OpportunityDrawer } from "./opportunity-drawer"
import { formatCurrency } from "@/lib/utils"

interface Opportunity {
  id: string
  title: string
  value?: number | null
  probability?: number | null
  expectedClose?: Date | null
  customer: { companyName?: string | null; tradeName?: string | null }
  assignee?: { name: string } | null
}

interface Stage {
  id: string
  name: string
  color: string
  isWon: boolean
  isLost: boolean
  opportunities: Opportunity[]
}

interface KanbanBoardProps {
  stages: Stage[]
  canDelete?: boolean
}

export function KanbanBoard({ stages: initialStages, canDelete = false }: KanbanBoardProps) {
  const router = useRouter()
  const [stages, setStages] = useState(initialStages)
  const [activeCard, setActiveCard] = useState<{ opp: Opportunity; stageId: string } | null>(null)

  useEffect(() => {
    setStages(initialStages)
  }, [initialStages])
  const [dragging, setDragging] = useState(false)
  const [selectedOppId, setSelectedOppId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  function handleCardClick(id: string) {
    setSelectedOppId(id)
    setDrawerOpen(true)
  }

  function handleOpportunityDeleted(id: string) {
    console.log("[KanbanBoard] onDeleted fired for id:", id)
    setStages((prev) =>
      prev.map((stage) => ({
        ...stage,
        opportunities: stage.opportunities.filter((o) => o.id !== id),
      }))
    )
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    const stageId = active.data.current?.stageId as string
    const stage = stages.find((s) => s.id === stageId)
    const opp = stage?.opportunities.find((o) => o.id === active.id)
    if (opp) {
      setActiveCard({ opp, stageId })
      setDragging(true)
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setDragging(false)
    setActiveCard(null)

    if (!over || active.id === over.id) return

    const fromStageId = active.data.current?.stageId as string
    const toStageId = over.data.current?.stageId as string || over.id as string

    if (fromStageId === toStageId) return

    const oppId = active.id as string

    // Optimistic update
    setStages((prev) => {
      const updated = prev.map((stage) => ({ ...stage, opportunities: [...stage.opportunities] }))
      const fromStage = updated.find((s) => s.id === fromStageId)
      const toStage = updated.find((s) => s.id === toStageId)
      if (!fromStage || !toStage) return prev
      const oppIndex = fromStage.opportunities.findIndex((o) => o.id === oppId)
      if (oppIndex === -1) return prev
      const [opp] = fromStage.opportunities.splice(oppIndex, 1)
      toStage.opportunities.push(opp)
      return updated
    })

    const result = await moveOpportunityStage(oppId, toStageId)
    if (!result.success) {
      setStages(initialStages)
      toast.error(result.error)
    } else {
      toast.success("Oportunidade movida")
      router.refresh()
    }
  }

  const totalValue = stages.reduce((sum, stage) => {
    if (stage.isWon || stage.isLost) return sum
    return sum + stage.opportunities.reduce((s, o) => s + (Number(o.value) || 0), 0)
  }, 0)

  return (
    <div className="space-y-4">
      {/* Sumário do funil */}
      <div className="flex items-center gap-6 text-sm">
        <div>
          <span className="text-muted-foreground">Total em negociação: </span>
          <span className="font-semibold">{formatCurrency(totalValue)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Oportunidades ativas: </span>
          <span className="font-semibold">
            {stages.filter((s) => !s.isWon && !s.isLost).reduce((sum, s) => sum + s.opportunities.length, 0)}
          </span>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => (
            <KanbanColumn key={stage.id} stage={stage} isDragging={dragging} onCardClick={handleCardClick} />
          ))}
        </div>

        <DragOverlay>
          {activeCard && (
            <div className="rotate-2 shadow-2xl opacity-90">
              <KanbanCard opportunity={activeCard.opp} stageId={activeCard.stageId} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <OpportunityDrawer
        opportunityId={selectedOppId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        canDelete={canDelete}
        onDeleted={handleOpportunityDeleted}
      />
    </div>
  )
}
