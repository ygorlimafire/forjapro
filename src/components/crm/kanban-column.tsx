"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { cn, formatCurrency } from "@/lib/utils"
import { KanbanCard } from "./kanban-card"
import { Badge } from "@/components/ui/badge"

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
}

export function KanbanColumn({ stage, isDragging }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: { stageId: stage.id },
  })

  const totalValue = stage.opportunities.reduce((sum, o) => sum + (Number(o.value) || 0), 0)

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Header da coluna */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: stage.color }}
          />
          <span className="text-sm font-semibold">{stage.name}</span>
          <Badge variant="secondary" className="text-xs h-5">
            {stage.opportunities.length}
          </Badge>
        </div>
        {totalValue > 0 && (
          <span className="text-xs text-muted-foreground">
            {formatCurrency(totalValue)}
          </span>
        )}
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 min-h-[400px] rounded-xl p-2 space-y-2 transition-colors",
          "bg-muted/40 border border-transparent",
          isOver && isDragging && "border-accent bg-accent/5"
        )}
      >
        <SortableContext
          items={stage.opportunities.map((o) => o.id)}
          strategy={verticalListSortingStrategy}
        >
          {stage.opportunities.map((opp) => (
            <KanbanCard key={opp.id} opportunity={opp} stageId={stage.id} />
          ))}
        </SortableContext>

        {stage.opportunities.length === 0 && (
          <div className="h-24 flex items-center justify-center">
            <p className="text-xs text-muted-foreground/50">Arraste aqui</p>
          </div>
        )}
      </div>
    </div>
  )
}
