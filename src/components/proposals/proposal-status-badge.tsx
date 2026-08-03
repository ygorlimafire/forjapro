import { Badge } from "@/components/ui/badge"
import type { ProposalStatus } from "@prisma/client"

const STATUS_CONFIG: Record<ProposalStatus, { label: string; className: string }> = {
  RASCUNHO:      { label: "Rascunho",       className: "bg-muted text-muted-foreground border-border" },
  ENVIADA:       { label: "Enviada",        className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300" },
  EM_NEGOCIACAO: { label: "Em Negociação",  className: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300" },
  APROVADA:      { label: "Aprovada",       className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300" },
  RECUSADA:      { label: "Recusada",       className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300" },
  VENCIDA:       { label: "Vencida",        className: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300" },
  CANCELADA:     { label: "Cancelada",      className: "bg-muted text-muted-foreground border-border" },
}

export function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  )
}
