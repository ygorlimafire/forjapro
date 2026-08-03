"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Building2, User, Calendar, DollarSign, GripVertical } from "lucide-react"

interface Opportunity {
  id: string
  title: string
  value?: number | null
  probability?: number | null
  expectedClose?: Date | null
  customer: { companyName?: string | null; tradeName?: string | null }
  assignee?: { name: string } | null
}

interface KanbanCardProps {
  opportunity: Opportunity
  stageId: string
}

export function KanbanCard({ opportunity, stageId }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: opportunity.id,
    data: { stageId },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const customerName =
    opportunity.customer.tradeName ||
    opportunity.customer.companyName ||
    "Cliente não informado"

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        className={cn(
          "cursor-grab active:cursor-grabbing select-none transition-shadow",
          isDragging && "opacity-40 shadow-none"
        )}
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start gap-2">
            <div
              className="text-muted-foreground/40 hover:text-muted-foreground transition-colors mt-0.5 shrink-0"
              {...listeners}
            >
              <GripVertical size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight truncate">
                {opportunity.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 size={11} />
            <span className="truncate">{customerName}</span>
          </div>

          {opportunity.value && (
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <DollarSign size={11} className="text-accent" />
              <span>{formatCurrency(Number(opportunity.value))}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            {opportunity.assignee && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User size={10} />
                <span className="truncate max-w-20">{opportunity.assignee.name}</span>
              </div>
            )}
            {opportunity.expectedClose && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                <Calendar size={10} />
                <span>{formatDate(opportunity.expectedClose)}</span>
              </div>
            )}
          </div>

          {opportunity.probability != null && (
            <div className="mt-1">
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all"
                  style={{ width: `${opportunity.probability}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 text-right">
                {opportunity.probability}% chance
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
