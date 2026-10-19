"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PurchasePdfButton({ purchaseOrderId }: { purchaseOrderId: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.open(`/api/purchases/${purchaseOrderId}/pdf`, "_blank")}
    >
      <Download size={14} />
      PDF
    </Button>
  )
}
