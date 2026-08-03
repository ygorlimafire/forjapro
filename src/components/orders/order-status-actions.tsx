"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { updateOrderStatus } from "@/actions/orders"
import { CheckCircle2, XCircle, Loader2, Package, Truck, AlertTriangle } from "lucide-react"
import type { OrderStatus, StockAlertStatus } from "@prisma/client"

interface OrderStatusActionsProps {
  orderId: string
  currentStatus: OrderStatus
  stockStatus: StockAlertStatus
  userRoleName: string
}

const NEXT_ACTIONS: Record<OrderStatus, { status: OrderStatus; label: string; icon: React.ReactNode; variant: "default" | "outline" | "destructive" }[]> = {
  PENDENTE: [
    { status: "CONFIRMADO", label: "Confirmar pedido", icon: <CheckCircle2 size={14} />, variant: "default" },
    { status: "CANCELADO", label: "Cancelar", icon: <XCircle size={14} />, variant: "destructive" },
  ],
  CONFIRMADO: [
    { status: "AGUARDANDO_EXPEDICAO", label: "Mercadoria recebida", icon: <Package size={14} />, variant: "default" },
    { status: "CANCELADO", label: "Cancelar", icon: <XCircle size={14} />, variant: "destructive" },
  ],
  AGUARDANDO_EXPEDICAO: [
    { status: "ENTREGUE", label: "Marcar como entregue", icon: <Truck size={14} />, variant: "default" },
    { status: "CANCELADO", label: "Cancelar", icon: <XCircle size={14} />, variant: "destructive" },
  ],
  ENTREGUE: [],
  CANCELADO: [],
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDENTE: "Aguardando confirmação",
  CONFIRMADO: "Pedido confirmado — aguardando mercadoria do fornecedor",
  AGUARDANDO_EXPEDICAO: "Mercadoria recebida — aguardando expedição ao cliente",
  ENTREGUE: "Entregue ao cliente",
  CANCELADO: "Pedido cancelado",
}

const STOCK_OVERRIDE_MESSAGE: Record<Exclude<StockAlertStatus, "OK">, string> = {
  PARCIAL: "Este pedido tem reserva de estoque parcial — a quantidade reservada é menor que a vendida. Confirmar a entrega agora pode gerar inconsistência no inventário.",
  INSUFICIENTE: "Nenhum item deste pedido foi reservado em estoque. Confirmar a entrega sem estoque disponível pode gerar inconsistência no inventário.",
}

export function OrderStatusActions({ orderId, currentStatus, stockStatus, userRoleName }: OrderStatusActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<OrderStatus | null>(null)
  const [showOverrideDialog, setShowOverrideDialog] = useState(false)

  const actions = NEXT_ACTIONS[currentStatus]
  const canOverride = userRoleName === "ADMIN" || userRoleName === "GERENTE"
  const needsStockOverride = currentStatus === "AGUARDANDO_EXPEDICAO" && stockStatus !== "OK"

  async function executeUpdate(status: OrderStatus, override = false) {
    setLoading(status)
    try {
      const result = await updateOrderStatus(orderId, status, override)
      if (!result.success) {
        toast.error(result.error)
      } else {
        toast.success(`Status atualizado: ${STATUS_LABEL[status]}`)
        router.refresh()
      }
    } catch {
      toast.error("Erro ao atualizar status")
    } finally {
      setLoading(null)
    }
  }

  async function handleUpdate(status: OrderStatus) {
    if (status === "ENTREGUE" && needsStockOverride) {
      if (!canOverride) {
        toast.error("Somente Gerente ou Admin podem confirmar entrega com estoque insuficiente.")
        return
      }
      setShowOverrideDialog(true)
      return
    }
    await executeUpdate(status)
  }

  return (
    <>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{STATUS_LABEL[currentStatus]}</p>
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <Button
                key={action.status}
                variant={action.variant}
                size="sm"
                onClick={() => handleUpdate(action.status)}
                disabled={!!loading}
              >
                {loading === action.status ? <Loader2 size={14} className="animate-spin" /> : action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-red-50 dark:bg-red-950/30">
              <AlertTriangle className="text-red-600 dark:text-red-400" />
            </AlertDialogMedia>
            <AlertDialogTitle>Confirmar entrega com estoque insuficiente?</AlertDialogTitle>
            <AlertDialogDescription>
              {stockStatus !== "OK" ? STOCK_OVERRIDE_MESSAGE[stockStatus as Exclude<StockAlertStatus, "OK">] : ""}
              {" "}Esta ação será registrada no log de auditoria com destaque.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowOverrideDialog(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setShowOverrideDialog(false)
                executeUpdate("ENTREGUE", true)
              }}
            >
              Confirmar entrega mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
