"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, ImageIcon, Plus, Loader2, AlertCircle } from "lucide-react"
import { getProducts, getCategories } from "@/actions/products"
import { formatCurrency } from "@/lib/utils"
import { createPortal } from "react-dom"
import Image from "next/image"
import { cn } from "@/lib/utils"

/* eslint-disable @typescript-eslint/no-explicit-any */
export type ProductResult = {
  id: string
  sku: string
  name: string
  mainImage: string | null
  listPrice: any    // Prisma Decimal — serialized as unknown shape over the wire
  costPrice: any
  description: string | null
  technicalSpecs: any
  warranty: string | null
  desiredMargin: any
  isCustomizable: boolean
  category: { name: string }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

type Category = { id: string; name: string }

interface ProductPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (product: ProductResult) => void
  selectedIds?: string[]
}

export function ProductPicker({ open, onOpenChange, onSelect, selectedIds = [] }: ProductPickerProps) {
  const [search, setSearch] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<ProductResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load categories once when picker opens
  useEffect(() => {
    if (!open || categories.length > 0) return
    getCategories().then(setCategories).catch(() => {})
  }, [open, categories.length])

  useEffect(() => {
    if (!open) return

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await getProducts(search || undefined, selectedCategoryId || undefined)
        setProducts(result as ProductResult[])
        setHasLoaded(true)
      } catch (err) {
        console.error("[ProductPicker] getProducts error:", err)
        setError("Erro ao carregar produtos. Tente novamente.")
        setProducts([])
      } finally {
        setLoading(false)
      }
    }, search ? 300 : 0)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [open, search, selectedCategoryId])

  // Focus search input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Reset state when dialog closes — multiple setStates in one effect is intentional here
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) {
      setSearch("")
      setSelectedCategoryId("")
      setHasLoaded(false)
      setError(null)
      setProducts([])
    }
  }, [open])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open, onOpenChange])

  // createPortal requires the browser DOM — typeof check avoids SSR errors
  if (typeof document === "undefined" || !open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative z-50 w-full max-w-2xl max-h-[80vh] bg-background rounded-xl border shadow-xl flex flex-col">
        {/* Header */}
        <div className="border-b">
          <div className="flex items-center gap-3 p-4 pb-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Buscar por nome, SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {loading && <Loader2 size={16} className="animate-spin text-muted-foreground shrink-0" />}
          </div>
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 px-4 pb-3 overflow-x-auto">
              <button
                type="button"
                onClick={() => setSelectedCategoryId("")}
                className={cn(
                  "shrink-0 text-xs px-2.5 py-1 rounded-full border transition-colors",
                  !selectedCategoryId
                    ? "bg-primary text-primary-foreground border-primary"
                    : "text-muted-foreground border-border hover:border-foreground/40"
                )}
              >
                Todas
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id === selectedCategoryId ? "" : cat.id)}
                  className={cn(
                    "shrink-0 text-xs px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap",
                    selectedCategoryId === cat.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "text-muted-foreground border-border hover:border-foreground/40"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive py-12 justify-center">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {!error && loading && !hasLoaded && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-12">
              <Loader2 size={16} className="animate-spin" />
              Carregando produtos...
            </div>
          )}

          {!error && !loading && hasLoaded && products.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {search ? "Nenhum produto encontrado para esta busca" : "Nenhum produto cadastrado"}
            </div>
          )}

          {products.map((product) => {
            const isSelected = selectedIds.includes(product.id)
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => { onSelect(product); onOpenChange(false) }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left group"
              >
                <div className="relative w-14 h-14 rounded-md overflow-hidden border bg-muted shrink-0">
                  {product.mainImage ? (
                    <Image src={product.mainImage} alt={product.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={20} className="text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    {product.isCustomizable && (
                      <Badge className="text-[10px] px-1.5 py-0 h-4 bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 shrink-0">SOB MEDIDA</Badge>
                    )}
                    {isSelected && (
                      <Badge variant="outline" className="text-xs shrink-0">Já adicionado</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{product.sku} · {product.category.name}</p>
                  <p className="text-xs font-medium text-foreground mt-0.5">
                    {product.isCustomizable ? "Preço por projeto" : formatCurrency(Number(product.listPrice))}
                  </p>
                </div>
                <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <Plus size={14} className="text-primary" />
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t flex justify-end">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
