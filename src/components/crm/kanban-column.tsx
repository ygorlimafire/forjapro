"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { cn, formatCurrency } from "@/lib/utils"
import { KanbanCard } from "./kanban-card"

const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }

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

interface KanbanColumnProps {
  stage: Stage
  isDragging: boolean
  onCardClick?: (id: string) => void
}

export function KanbanColumn({ stage, isDragging, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: { stageId: stage.id },
  })

  const totalValue = stage.opportunities.reduce((sum, o) => sum + (Number(o.value) || 0), 0)

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Header da coluna */}
      <div
        className="mb-3 px-1 pb-2.5"
        style={{ borderBottom: `2px solid ${stage.color}` }}
      >
        <div className="flex items-center justify-between">
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "15px",
              color: "#16181c",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {stage.name}
          </span>
          <span style={{ ...mono, fontSize: "11px", color: "#9ba1a8" }}>
            {stage.opportunities.length}
          </span>
        </div>
        {totalValue > 0 && (
          <p style={{ ...mono, fontSize: "12px", color: "#b5652f", marginTop: "2px" }}>
            {formatCurrency(totalValue)}
          </p>
        )}
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 min-h-[400px] p-2 space-y-2 transition-colors",
          "bg-[#f5f6f7]",
          isOver && isDragging && "bg-[#eceef0]"
        )}
      >
        <SortableContext
          items={stage.opportunities.map((o) => o.id)}
          strategy={verticalListSortingStrategy}
        >
          {stage.opportunities.map((opp) => (
            <KanbanCard key={opp.id} opportunity={opp} stageId={stage.id} onCardClick={onCardClick} />
          ))}
        </SortableContext>

        {stage.opportunities.length === 0 && (
          <div className="h-24 flex items-center justify-center">
            <p style={{ ...mono, fontSize: "11px", color: "#9ba1a8" }}>Arraste aqui</p>
          </div>
        )}
      </div>
    </div>
  )
}
