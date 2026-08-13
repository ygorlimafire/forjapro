import { Badge } from "@/components/ui/badge"
import type { BadgeVariant } from "@/components/ui/badge"

type StatusConfig = { variant: BadgeVariant; label: string }

const STATUS_MAP: Record<string, StatusConfig> = {
  // ── Propostas ──
  RASCUNHO:       { variant: "neutral",  label: "RASCUNHO" },
  ENVIADA:        { variant: "info",     label: "ENVIADA" },
  EM_NEGOCIACAO:  { variant: "warning",  label: "EM NEGOCIAÇÃO" },
  APROVADA:       { variant: "success",  label: "APROVADA" },
  RECUSADA:       { variant: "danger",   label: "RECUSADA" },
  VENCIDA:        { variant: "neutral",  label: "VENCIDA" },

  // ── Pedidos ──
  PENDENTE:              { variant: "warning", label: "PENDENTE" },
  CONFIRMADO:            { variant: "info",    label: "CONFIRMADO" },
  AGUARDANDO_EXPEDICAO:  { variant: "info",    label: "AGUARD. EXPEDIÇÃO" },
  ENTREGUE:              { variant: "success", label: "ENTREGUE" },
  CANCELADO:             { variant: "neutral", label: "CANCELADO" },
  CANCELADA:             { variant: "neutral", label: "CANCELADA" },

  // ── Financeiro ──
  PAGO:    { variant: "success", label: "PAGO" },
  VENCIDO: { variant: "danger",  label: "VENCIDO" },

  // ── Estoque ──
  NORMAL: { variant: "success", label: "NORMAL" },
  BAIXO:  { variant: "danger",  label: "BAIXO" },

  // ── Compras ──
  RECEBIDA:  { variant: "success", label: "RECEBIDA" },
  APROVADA_COMPRA: { variant: "info", label: "APROVADA" },

  // ── Cliente / Produto / Usuário ──
  ATIVO:   { variant: "success", label: "ATIVO" },
  INATIVO: { variant: "neutral", label: "INATIVO" },
}

export function StatusBadge({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  const config: StatusConfig = STATUS_MAP[status] ?? {
    variant: "neutral",
    label: status,
  }
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}
