"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { addStockAdjustment } from "@/actions/stock"
import { stockAdjustSchema, type StockAdjustData } from "@/lib/validations/stock"
import { SlidersHorizontal, Loader2 } from "lucide-react"

interface StockAdjustDialogProps {
  warehouseId: string
  productId?: string
}

const ADJUST_TYPES = [
  { value: "AJUSTE", label: "Ajuste de inventário", description: "Corrigir divergência (use quantidade negativa para reduzir)" },
  { value: "DEVOLUCAO", label: "Devolução", description: "Produto retornou ao estoque" },
  { value: "PERDA", label: "Perda / Extravio", description: "Produto danificado ou extraviado" },
]

export function StockAdjustDialog({ warehouseId, productId }: StockAdjustDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<StockAdjustData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(stockAdjustSchema) as any,
    defaultValues: { warehouseId, productId: productId ?? "", type: "AJUSTE" },
  })

  const type = watch("type")

  async function onSubmit(data: StockAdjustData) {
    const result = await addStockAdjustment(data)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success("Ajuste registrado com sucesso")
    setOpen(false)
    reset()
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="outline" size="sm">
          <SlidersHorizontal size={14} />
          Ajuste manual
        </Button>
      } />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajuste Manual de Estoque</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {!productId && (
            <div className="space-y-1.5">
              <Label>ID do Produto</Label>
              <Input placeholder="ID do produto..." {...register("productId")} />
              {errors.productId && <p className="text-xs text-destructive">{errors.productId.message}</p>}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Tipo de ajuste *</Label>
            <div className="space-y-2">
              {ADJUST_TYPES.map((t) => (
                <label key={t.value} className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer has-[:checked]:border-foreground/50 has-[:checked]:bg-accent/30 transition-colors">
                  <input type="radio" value={t.value} {...register("type")} className="mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{t.label}</p>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>
                Quantidade *
                {type === "AJUSTE" && <span className="text-xs text-muted-foreground font-normal"> (negativo = reduzir)</span>}
              </Label>
              <Input
                type="number"
                step="1"
                {...register("quantity", { valueAsNumber: true })}
              />
              {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Número de série <span className="text-muted-foreground font-normal text-xs">(opcional)</span></Label>
              <Input placeholder="SN-001" {...register("serialNumber")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Justificativa * <span className="text-xs text-muted-foreground font-normal">(mín. 10 caracteres)</span></Label>
            <Textarea
              placeholder="Descreva o motivo do ajuste — ex: inventário físico revelou divergência de 2 unidades..."
              rows={3}
              {...register("reason")}
            />
            {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { setOpen(false); reset() }}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
              Registrar ajuste
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
