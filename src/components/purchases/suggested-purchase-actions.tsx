"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"

interface Props {
  productId: string
  productName: string
  productSku: string
  suggestedQty: number
  relatedOrderIds: string[]
}

export function SuggestedPurchaseActions({ productId, suggestedQty, relatedOrderIds }: Props) {
  const router = useRouter()

  function handleCreate() {
    const params = new URLSearchParams({
      produto: productId,
      qty: String(suggestedQty),
      ...(relatedOrderIds.length ? { pedidos: relatedOrderIds.join(",") } : {}),
    })
    router.push(`/compras/nova?${params.toString()}`)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCreate} className="shrink-0">
      <ShoppingCart size={13} />
      Criar compra
    </Button>
  )
}
