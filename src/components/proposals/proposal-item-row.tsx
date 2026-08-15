"use client"

import { useEffect } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, ImageIcon, Pencil } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { ProposalFormData } from "@/lib/validations/proposal"

interface ProposalItemRowProps {
  index: number
  onRemove: () => void
  minMargin: number
}

export function ProposalItemRow({ index, onRemove, minMargin }: ProposalItemRowProps) {
  const { register, setValue, control } = useFormContext<ProposalFormData>()

  const isCustomItem = useWatch({ control, name: `items.${index}.isCustomItem` }) ?? false
  const listPrice = useWatch({ control, name: `items.${index}.listPrice` }) || 0
  const costPrice = useWatch({ control, name: `items.${index}.costPrice` }) || 0
  const customCost = useWatch({ control, name: `items.${index}.customCost` })
  const ipiPct = useWatch({ control, name: `items.${index}.ipiPct` }) || 0
  const discountPct = useWatch({ control, name: `items.${index}.discountPct` }) || 0
  const quantity = useWatch({ control, name: `items.${index}.quantity` }) || 1
  const productName = useWatch({ control, name: `items.${index}.productName` }) || ""
  const productSku = useWatch({ control, name: `items.${index}.productSku` }) || ""
  const productImage = useWatch({ control, name: `items.${index}.productImage` })
  const netPriceRaw = useWatch({ control, name: `items.${index}.netPrice` }) || 0

  const effectiveCost = customCost != null ? customCost : costPrice

  // For regular items: calculate netPrice from listPrice + IPI + discount
  // For custom items: netPrice is edited directly
  useEffect(() => {
    if (isCustomItem) {
      const netPrice = netPriceRaw
      const subtotal = quantity * netPrice
      const estimatedMargin = netPrice - effectiveCost
      const estimatedMarginPct = netPrice > 0 ? (estimatedMargin / netPrice) * 100 : 0
      setValue(`items.${index}.listPrice`, parseFloat(netPrice.toFixed(2)))
      setValue(`items.${index}.subtotal`, parseFloat(subtotal.toFixed(2)))
      setValue(`items.${index}.estimatedMargin`, parseFloat(estimatedMargin.toFixed(2)))
      setValue(`items.${index}.estimatedMarginPct`, parseFloat(estimatedMarginPct.toFixed(2)))
    } else {
      const priceWithIpi = listPrice * (1 + ipiPct / 100)
      const discountAmount = priceWithIpi * (discountPct / 100)
      const netPrice = Math.max(0, priceWithIpi - discountAmount)
      const subtotal = quantity * netPrice
      const estimatedMargin = netPrice - effectiveCost
      const estimatedMarginPct = netPrice > 0 ? (estimatedMargin / netPrice) * 100 : 0
      setValue(`items.${index}.netPrice`, parseFloat(netPrice.toFixed(2)))
      setValue(`items.${index}.subtotal`, parseFloat(subtotal.toFixed(2)))
      setValue(`items.${index}.estimatedMargin`, parseFloat(estimatedMargin.toFixed(2)))
      setValue(`items.${index}.estimatedMarginPct`, parseFloat(estimatedMarginPct.toFixed(2)))
    }
  }, [isCustomItem, listPrice, costPrice, customCost, ipiPct, discountPct, quantity, netPriceRaw, index, setValue, effectiveCost])

  // Derived display values
  const netPrice = isCustomItem
    ? netPriceRaw
    : Math.max(0, listPrice * (1 + ipiPct / 100) * (1 - discountPct / 100))
  const subtotal = quantity * netPrice
  const estimatedMarginPct = netPrice > 0 ? ((netPrice - effectiveCost) / netPrice) * 100 : 0
  const isBelowMin = estimatedMarginPct < minMargin

  return (
    <div className={`border rounded-lg p-4 space-y-3 transition-colors ${isBelowMin ? "border-red-200 bg-red-50/30 dark:border-red-900/50 dark:bg-red-950/10" : "border-border bg-background"}`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        {!isCustomItem && (
          <div className="w-14 h-14 rounded-md overflow-hidden border bg-muted shrink-0">
            {productImage ? (
              <Image src={productImage} alt={productName} width={56} height={56} className="w-full h-full object-cover" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon size={20} className="text-muted-foreground/30" />
              </div>
            )}
          </div>
        )}

        {isCustomItem && (
          <div className="w-14 h-14 rounded-md border bg-amber-50 shrink-0 flex items-center justify-center">
            <Pencil size={18} className="text-amber-600" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {isCustomItem ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 uppercase tracking-wide">
                      {productSku ? "SOB MEDIDA" : "ITEM AVULSO"}
                    </span>
                  </div>
                  <Input
                    placeholder="Nome / descrição do item *"
                    className="h-8 text-sm font-medium"
                    {...register(`items.${index}.productName`)}
                  />
                  <Input
                    placeholder="Código / referência (opcional)"
                    className="h-7 text-xs"
                    {...register(`items.${index}.productSku`)}
                  />
                </div>
              ) : (
                <div>
                  <p className="font-medium text-sm leading-tight">{productName}</p>
                  <p className="text-xs text-muted-foreground">{productSku}</p>
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
              onClick={onRemove}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* Editable fields */}
      {isCustomItem ? (
        // Custom item: direct price entry + optional cost
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Qtd</label>
            <Input
              type="number"
              min="1"
              step="1"
              className="h-8 text-sm"
              {...register(`items.${index}.quantity`, { valueAsNumber: true })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Preço de venda *</label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              className="h-8 text-sm"
              {...register(`items.${index}.netPrice`, { valueAsNumber: true })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Custo (opcional)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="Para margem"
              className="h-8 text-sm"
              {...register(`items.${index}.customCost`, { valueAsNumber: true, setValueAs: (v) => v === "" || isNaN(v) ? null : Number(v) })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Qtd × preço</label>
            <div className="h-8 flex items-center px-2 rounded-md bg-muted text-sm font-medium">
              {formatCurrency(subtotal)}
            </div>
          </div>
        </div>
      ) : (
        // Regular item: list price + IPI + discount
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Qtd</label>
            <Input
              type="number"
              min="1"
              step="1"
              className="h-8 text-sm"
              {...register(`items.${index}.quantity`, { valueAsNumber: true })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Preço tabela</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              className="h-8 text-sm"
              {...register(`items.${index}.listPrice`, { valueAsNumber: true })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">IPI (%)</label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="0"
              className="h-8 text-sm"
              {...register(`items.${index}.ipiPct`, { valueAsNumber: true })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Desc. (%)</label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="0"
              className="h-8 text-sm"
              {...register(`items.${index}.discountPct`, { valueAsNumber: true })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Qtd × preço liq.</label>
            <div className="h-8 flex items-center px-2 rounded-md bg-muted text-sm font-medium">
              {formatCurrency(subtotal)}
            </div>
          </div>
        </div>
      )}

      {/* Specs textarea for custom items */}
      {isCustomItem && (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Especificações técnicas / observações do projeto</label>
          <Textarea
            placeholder="Descreva medidas, material, capacidade, acabamento e outros detalhes do projeto..."
            rows={3}
            className="text-xs resize-none"
            {...register(`items.${index}.customSpecs`)}
          />
        </div>
      )}

      {/* Summary */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span>Preço líquido: <strong className="text-foreground">{formatCurrency(netPrice)}</strong></span>
        <span>Subtotal: <strong className="text-foreground">{formatCurrency(subtotal)}</strong></span>
        <span>
          Margem:{" "}
          {customCost != null || !isCustomItem ? (
            <strong className={isBelowMin ? "text-red-600" : estimatedMarginPct >= 30 ? "text-green-600" : "text-yellow-600"}>
              {estimatedMarginPct.toFixed(1)}%
              {isBelowMin && " ⚠"}
            </strong>
          ) : (
            <span className="italic">Sem custo informado</span>
          )}
        </span>
      </div>

      {/* Hidden fields */}
      <input type="hidden" {...register(`items.${index}.isCustomItem`, { setValueAs: (v) => v === "true" || v === true })} />
      {/* netPrice hidden only for regular items — custom items have a visible input; a duplicate register would reset the value on re-render */}
      {!isCustomItem && <input type="hidden" {...register(`items.${index}.netPrice`, { valueAsNumber: true })} />}
      <input type="hidden" {...register(`items.${index}.subtotal`, { valueAsNumber: true })} />
      <input type="hidden" {...register(`items.${index}.estimatedMargin`, { valueAsNumber: true })} />
      <input type="hidden" {...register(`items.${index}.estimatedMarginPct`, { valueAsNumber: true })} />
      <input type="hidden" {...register(`items.${index}.productId`)} />
      <input type="hidden" {...register(`items.${index}.position`, { valueAsNumber: true })} />
      {!isCustomItem && <input type="hidden" {...register(`items.${index}.productName`)} />}
      {!isCustomItem && <input type="hidden" {...register(`items.${index}.productSku`)} />}
      <input type="hidden" {...register(`items.${index}.productImage`)} />
      <input type="hidden" {...register(`items.${index}.productDescription`)} />
      <input type="hidden" {...register(`items.${index}.costPrice`, { valueAsNumber: true })} />
    </div>
  )
}
