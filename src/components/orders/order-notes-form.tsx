"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { updateOrderNotes } from "@/actions/orders"
import { Save, Loader2 } from "lucide-react"

interface OrderNotesFormProps {
  orderId: string
  initialNotes: string
}

export function OrderNotesForm({ orderId, initialNotes }: OrderNotesFormProps) {
  const [notes, setNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const result = await updateOrderNotes(orderId, notes)
      if (!result.success) {
        toast.error(result.error)
      } else {
        toast.success("Observações salvas")
      }
    } catch {
      toast.error("Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Anotações internas sobre este pedido..."
        rows={4}
      />
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Salvar
        </Button>
      </div>
    </div>
  )
}
