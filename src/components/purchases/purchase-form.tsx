"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createPurchaseOrder } from "@/actions/purchases"
import { formatCurrency } from "@/lib/utils"
import { ProductPicker } from "@/components/proposals/product-picker"
import type { ProductResult } from "@/components/proposals/product-picker"
import { Plus, Trash2, Loader2, Package, ImageIcon } from "lucide-react"
import Image from "next/image"

interface Supplier {
  id: string
  companyName: string
  tradeName: string | null
}

interface PurchaseItem {
  productId: string
  productName: string
  productSku: string
  productImage: string | null
  quantity: number
  unitCost: number
}

interface PurchaseFormProps {
  suppliers: Supplier[]
  prefillItem?: PurchaseItem
  prefillLinkedOrderIds?: string[]
}

export function PurchaseForm({
  suppliers,
  prefillItem,
  prefillLinkedOrderIds,
}: PurchaseFormProps) {
  const router = useRouter()
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "")
  const [items, setItems] = useState<PurchaseItem[]>(() => prefillItem ? [prefillItem] : [])
  const [expectedAt, setExpectedAt] = useState("")
  const [notes, setNotes] = useState("")
  const [pickerOpen, setPickerOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleProductSelect(product: ProductResult) {
    const alreadyAdded = items.find((i) => i.productId === product.id)
    if (alreadyAdded) {
      toast.info("Produto já está na lista. Ajuste a quantidade diretamente.")
      return
    }
    setItems((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        productImage: product.mainImage,
        quantity: 1,
        unitCost: Number(product.costPrice) || 0,
      },
    ])
  }

  function updateItem(idx: number, field: "quantity" | "unitCost", value: number) {
    setItems((prev) => prev.map((item, i) =>
      i === idx ? { ...item, [field]: Math.max(field === "quantity" ? 1 : 0, value) } : item
    ))
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const totalAmount = items.reduce((s, i) => s + i.quantity * i.unitCost, 0)

  async function handleSubmit(sendImmediately: boolean) {
    if (!supplierId) { toast.error("Selecione um fornecedor"); return }
    if (items.length === 0) { toast.error("Adicione ao menos um produto"); return }

    setLoading(true)
    try {
      const result = await createPurchaseOrder({
        supplierId,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitCost: i.unitCost,
        })),
        expectedAt: expectedAt || undefined,
        notes: notes || undefined,
        linkedOrderIds: prefillLinkedOrderIds,
        sendImmediately,
      })

      if (!result.success) {
        toast.error(result.error)
      } else {
        toast.success(`Pedido de compra ${result.data.number} criado!`)
        router.push(`/compras/${result.data.id}`)
      }
    } catch {
      toast.error("Erro ao criar pedido de compra")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Supplier */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Fornecedor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="supplier">Fornecedor *</Label>
            <select
              id="supplier"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Selecionar fornecedor...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.tradeName || s.companyName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="expectedAt">Previsão de entrega</Label>
              <Input
                id="expectedAt"
                type="date"
                value={expectedAt}
                onChange={(e) => setExpectedAt(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Condições especiais, referências, etc."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Produtos ({items.length})</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPickerOpen(true)}
            >
              <Plus size={14} />
              Adicionar produto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package size={32} className="text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum produto adicionado</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setPickerOpen(true)}
              >
                <Plus size={13} />
                Adicionar produto
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Header */}
              <div className="hidden md:grid grid-cols-[1fr_120px_140px_32px] gap-3 pb-1 border-b text-xs text-muted-foreground font-medium">
                <span>Produto</span>
                <span className="text-right">Quantidade</span>
                <span className="text-right">Custo unitário</span>
                <span />
              </div>

              {items.map((item, idx) => (
                <div key={item.productId} className="grid md:grid-cols-[1fr_120px_140px_32px] gap-3 items-center pb-3 border-b last:border-0 last:pb-0">
                  {/* Product */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-10 h-10 rounded border bg-muted shrink-0 overflow-hidden">
                      {item.productImage ? (
                        <Image src={item.productImage} alt="" fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={14} className="text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">{item.productSku}</p>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center gap-2">
                    <span className="md:hidden text-xs text-muted-foreground shrink-0">Qtd:</span>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                      className="text-right h-8 text-sm"
                    />
                  </div>

                  {/* Unit cost */}
                  <div className="flex items-center gap-2">
                    <span className="md:hidden text-xs text-muted-foreground shrink-0">Custo:</span>
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.unitCost}
                        onChange={(e) => updateItem(idx, "unitCost", parseFloat(e.target.value) || 0)}
                        className="pl-7 text-right h-8 text-sm"
                      />
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-muted-foreground hover:text-destructive transition-colors justify-self-center"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}

              {/* Total */}
              {items.length > 0 && (
                <div className="flex justify-end pt-2 border-t">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total do pedido</p>
                    <p className="text-lg font-bold">{formatCurrency(totalAmount)}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSubmit(false)}
          disabled={loading || items.length === 0}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          Salvar rascunho
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={loading || items.length === 0}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          Criar e enviar ao fornecedor
        </Button>
      </div>

      <ProductPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleProductSelect}
        selectedIds={items.map((i) => i.productId)}
      />
    </div>
  )
}
