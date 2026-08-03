"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { updatePurchaseOrderStatus } from "@/actions/purchases"
import { CheckCircle2, XCircle, Send, Loader2, PackageCheck } from "lucide-react"
import { ReceiveItemsDialog } from "./receive-items-dialog"
import type { PurchaseOrderStatus } from "@prisma/client"

interface POItem {
  id: string
  productId: string
  quantity: number
  unitCost: number
  receivedQty: number
  product: { name: string; sku: string }
}

interface PurchaseStatusActionsProps {
  purchaseOrderId: string
  currentStatus: PurchaseOrderStatus
  items: POItem[]
}

const STATUS_LABEL: Record<PurchaseOrderStatus, string> = {
  RASCUNHO: "Rascunho — aguardando envio ao fornecedor",
  ENVIADO: "Enviado ao fornecedor — aguardando confirmação",
  CONFIRMADO: "Confirmado pelo fornecedor — aguardando recebimento",
  RECEBIDO_PARCIAL: "Recebimento parcial — ainda há itens pendentes",
  RECEBIDO_TOTAL: "Recebimento concluído",
  CANCELADO: "Pedido cancelado",
}

type ButtonAction = {
  label: string
  icon: React.ReactNode
  variant: "default" | "outline" | "destructive"
  onClick: () => void
}

export function PurchaseStatusActions({ purchaseOrderId, currentStatus, items }: PurchaseStatusActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [receiveOpen, setReceiveOpen] = useState(false)

  async function handleStatusUpdate(status: PurchaseOrderStatus) {
    setLoading(status)
    try {
      const result = await updatePurchaseOrderStatus(purchaseOrderId, status)
      if (!result.success) {
        toast.error(result.error)
      } else {
        toast.success("Status atualizado")
        router.refresh()
      }
    } catch {
      toast.error("Erro ao atualizar status")
    } finally {
      setLoading(null)
    }
  }

  const actions: ButtonAction[] = []

  if (currentStatus === "RASCUNHO") {
    actions.push({
      label: "Marcar como enviado",
      icon: <Send size={14} />,
      variant: "default",
      onClick: () => handleStatusUpdate("ENVIADO"),
    })
    actions.push({
      label: "Cancelar pedido",
      icon: <XCircle size={14} />,
      variant: "destructive",
      onClick: () => handleStatusUpdate("CANCELADO"),
    })
  }

  if (currentStatus === "ENVIADO") {
    actions.push({
      label: "Confirmar pelo fornecedor",
      icon: <CheckCircle2 size={14} />,
      variant: "default",
      onClick: () => handleStatusUpdate("CONFIRMADO"),
    })
    actions.push({
      label: "Cancelar pedido",
      icon: <XCircle size={14} />,
      variant: "destructive",
      onClick: () => handleStatusUpdate("CANCELADO"),
    })
  }

  if (currentStatus === "CONFIRMADO" || currentStatus === "RECEBIDO_PARCIAL") {
    const hasPending = items.some((i) => i.receivedQty < i.quantity)
    if (hasPending) {
      actions.push({
        label: "Registrar recebimento",
        icon: <PackageCheck size={14} />,
        variant: "default",
        onClick: () => setReceiveOpen(true),
      })
    }
    actions.push({
      label: "Cancelar pedido",
      icon: <XCircle size={14} />,
      variant: "destructive",
      onClick: () => handleStatusUpdate("CANCELADO"),
    })
  }

  return (
    <>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{STATUS_LABEL[currentStatus]}</p>
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant}
                size="sm"
                onClick={action.onClick}
                disabled={!!loading}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      <ReceiveItemsDialog
        open={receiveOpen}
        onOpenChange={setReceiveOpen}
        purchaseOrderId={purchaseOrderId}
        items={items}
      />
    </>
  )
}
