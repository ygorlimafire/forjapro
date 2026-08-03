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
import { addStockEntry } from "@/actions/stock"
import { stockEntrySchema, type StockEntryData } from "@/lib/validations/stock"
import { ProductPicker, type ProductResult } from "@/components/proposals/product-picker"
import { Plus, Loader2, PlusCircle, X, Search, ImageIcon } from "lucide-react"
import Image from "next/image"

interface StockEntryDialogProps {
  warehouseId: string
  productId?: string
}

export function StockEntryDialog({ warehouseId, productId }: StockEntryDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductResult | null>(null)
  const [serials, setSerials] = useState<string[]>([])
  const [serialInput, setSerialInput] = useState("")

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<StockEntryData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(stockEntrySchema) as any,
    defaultValues: { warehouseId, productId: productId ?? "", quantity: 1 },
  })

  const quantity = watch("quantity")

  function handleProductSelect(product: ProductResult) {
    setSelectedProduct(product)
    setValue("productId", product.id)
  }

  function clearProduct() {
    setSelectedProduct(null)
    setValue("productId", "")
  }

  function addSerial() {
    const sn = serialInput.trim()
    if (!sn || serials.includes(sn)) return
    setSerials((prev) => [...prev, sn])
    setSerialInput("")
  }

  function handleClose(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      reset()
      setSerials([])
      if (!productId) {
        setSelectedProduct(null)
      }
    }
  }

  async function onSubmit(data: StockEntryData) {
    const result = await addStockEntry({ ...data, serialNumbers: serials.length ? serials : undefined })
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success(`Entrada de ${data.quantity} unidade${data.quantity !== 1 ? "s" : ""} registrada`)
    handleClose(false)
    router.refresh()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogTrigger render={
          <Button size="sm">
            <Plus size={14} />
            Nova entrada
          </Button>
        } />
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Entrada de Estoque</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            {!productId && (
              <div className="space-y-1.5">
                <Label>Produto *</Label>
                {selectedProduct ? (
                  <div className="flex items-center gap-3 p-2.5 rounded-lg border bg-muted/40">
                    <div className="relative w-9 h-9 rounded border bg-muted shrink-0 overflow-hidden">
                      {selectedProduct.mainImage ? (
                        <Image src={selectedProduct.mainImage} alt={selectedProduct.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={14} className="text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedProduct.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedProduct.sku}</p>
                    </div>
                    <button type="button" onClick={clearProduct} className="shrink-0 text-muted-foreground hover:text-foreground">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed text-sm text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                  >
                    <Search size={14} />
                    Buscar produto por nome ou SKU...
                  </button>
                )}
                {errors.productId && <p className="text-xs text-destructive">{errors.productId.message}</p>}
              </div>
            )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Quantidade *</Label>
              <Input type="number" min={1} {...register("quantity", { valueAsNumber: true })} />
              {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Custo unitário (R$)</Label>
              <Input type="number" step="0.01" min={0} placeholder="0,00" {...register("unitCost", { valueAsNumber: true })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Números de série <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <div className="flex gap-2">
              <Input
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSerial() } }}
                placeholder="Ex: SN-2024-001"
              />
              <Button type="button" variant="outline" size="sm" onClick={addSerial}>
                <PlusCircle size={14} />
              </Button>
            </div>
            {serials.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {serials.map((sn) => (
                  <span key={sn} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-xs font-mono">
                    {sn}
                    <button type="button" onClick={() => setSerials((p) => p.filter((s) => s !== sn))}>
                      <X size={10} className="text-muted-foreground" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {serials.length > 0 && serials.length !== quantity && (
              <p className="text-xs text-yellow-600">
                {serials.length} número{serials.length !== 1 ? "s" : ""} de série para {quantity} unidade{quantity !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Observação</Label>
            <Textarea placeholder="Ex: NF 12345, pedido de compra #..." rows={2} {...register("notes")} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Registrar entrada
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {!productId && (
      <ProductPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleProductSelect}
      />
    )}
    </>
  )
}
