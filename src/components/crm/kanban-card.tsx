"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { formatCurrency, formatDate } from "@/lib/utils"
import { GripVertical } from "lucide-react"

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

interface KanbanCardProps {
  opportunity: Opportunity
  stageId: string
  onCardClick?: (id: string) => void
}

export function KanbanCard({ opportunity, stageId, onCardClick }: KanbanCardProps) {
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
    opacity: isDragging ? 0.4 : 1,
  }

  const customerName =
    opportunity.customer.tradeName ||
    opportunity.customer.companyName ||
    "Cliente não informado"

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        style={{
          background: "#fff",
          border: "1px solid #dde0e3",
          padding: "14px",
          position: "relative",
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => onCardClick?.(opportunity.id)}
      >
        {/* Copper triangle top-right */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 10,
            height: 10,
            background: "#b5652f",
            clipPath: "polygon(100% 0, 100% 100%, 0 0)",
          }}
        />

        {/* Grip + title */}
        <div className="flex items-start gap-2 mb-2">
          <div
            className="text-[#dde0e3] hover:text-[#9ba1a8] transition-colors mt-0.5 shrink-0"
            {...listeners}
          >
            <GripVertical size={14} />
          </div>
          <p style={{ fontWeight: 600, fontSize: "14px", color: "#16181c", lineHeight: 1.3, flex: 1 }}>
            {opportunity.title}
          </p>
        </div>

        {/* Customer */}
        <p style={{ ...mono, fontSize: "11px", color: "#9ba1a8", marginBottom: "8px", paddingLeft: "22px" }}>
          {customerName}
        </p>

        {/* Value */}
        {opportunity.value && (
          <p style={{ ...mono, fontSize: "14px", color: "#b5652f", fontWeight: 600, paddingLeft: "22px" }}>
            {formatCurrency(Number(opportunity.value))}
          </p>
        )}

        {/* Probability bar */}
        {opportunity.probability != null && (
          <div style={{ marginTop: "10px", paddingLeft: "22px" }}>
            <div style={{ height: "2px", background: "#eceef0" }}>
              <div
                style={{
                  height: "100%",
                  background: "#b5652f",
                  width: `${opportunity.probability}%`,
                  transition: "width 0.3s",
                }}
              />
            </div>
            <p style={{ ...mono, fontSize: "10px", color: "#9ba1a8", marginTop: "3px", textAlign: "right" }}>
              {opportunity.probability}%
            </p>
          </div>
        )}

        {/* Footer: assignee + close date */}
        {(opportunity.assignee || opportunity.expectedClose) && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px", paddingLeft: "22px" }}>
            {opportunity.assignee && (
              <span style={{ ...mono, fontSize: "10px", color: "#9ba1a8" }}>
                {opportunity.assignee.name}
              </span>
            )}
            {opportunity.expectedClose && (
              <span style={{ ...mono, fontSize: "10px", color: "#9ba1a8", marginLeft: "auto" }}>
                {formatDate(opportunity.expectedClose)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
