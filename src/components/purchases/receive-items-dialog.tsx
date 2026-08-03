"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { receivePurchaseItems } from "@/actions/purchases"
import { Loader2, Package } from "lucide-react"

interface POItem {
  id: string
  productId: string
  quantity: number
  unitCost: number
  receivedQty: number
  product: {
    name: string
    sku: string
  }
}

interface ReceiveItemsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchaseOrderId: string
  items: POItem[]
}

export function ReceiveItemsDialog({ open, onOpenChange, purchaseOrderId, items }: ReceiveItemsDialogProps) {
  const router = useRouter()
  const pendingItems = items.filter((i) => i.receivedQty < i.quantity)

  const [quantities, setQuantities] = useState<Record<string, number>>(
    () => Object.fromEntries(pendingItems.map((i) => [i.id, i.quantity - i.receivedQty]))
  )
  const [payableDueDays, setPayableDueDays] = useState(28)
  const [loading, setLoading] = useState(false)

  function updateQty(itemId: string, value: number) {
    const item = pendingItems.find((i) => i.id === itemId)
    if (!item) return
    const max = item.quantity - item.receivedQty
    setQuantities((prev) => ({ ...prev, [itemId]: Math.min(Math.max(0, value), max) }))
  }

  async function handleSubmit() {
    const received = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([purchaseOrderItemId, receivingQty]) => ({ purchaseOrderItemId, receivingQty }))

    if (!received.length) {
      toast.error("Informe ao menos uma quantidade recebida")
      return
    }

    setLoading(true)
    try {
      const result = await receivePurchaseItems(purchaseOrderId, received, payableDueDays)
      if (!result.success) {
        toast.error(result.error)
      } else {
        toast.success("Recebimento registrado com sucesso!")
        onOpenChange(false)
        router.refresh()
      }
    } catch {
      toast.error("Erro ao registrar recebimento")
    } finally {
      setLoading(false)
    }
  }

  if (pendingItems.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar recebimento</DialogTitle>
          <DialogDescription>
            Informe a quantidade recebida por item. Você pode receber parcialmente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {pendingItems.map((item) => {
            const remaining = item.quantity - item.receivedQty
            return (
              <div key={item.id} className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <Package size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">{item.product.sku}</p>
                    <p className="text-xs text-muted-foreground">
                      Pedido: {item.quantity} · Já recebido: {item.receivedQty} · Pendente: {remaining}
                    </p>
                  </div>
                  <div className="w-24 shrink-0">
                    <Input
                      type="number"
                      min={0}
                      max={remaining}
                      value={quantities[item.id] ?? 0}
                      onChange={(e) => updateQty(item.id, parseInt(e.target.value) || 0)}
                      className="h-8 text-right text-sm"
                    />
                  </div>
                </div>
              </div>
            )
          })}

          <div className="pt-2 border-t space-y-1.5">
            <Label htmlFor="payableDueDays" className="text-xs">
              Prazo de pagamento (dias corridos)
            </Label>
            <Input
              id="payableDueDays"
              type="number"
              min={1}
              value={payableDueDays}
              onChange={(e) => setPayableDueDays(parseInt(e.target.value) || 28)}
              className="h-8 w-32 text-sm"
            />
            <p className="text-xs text-muted-foreground">Conta a pagar será criada com vencimento em {payableDueDays} dias.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            Confirmar recebimento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
