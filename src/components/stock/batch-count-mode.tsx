"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { toast } from "sonner"
import { Package, X, Save, ChevronDown } from "lucide-react"
import { batchCountStock } from "@/actions/stock"

type StockItem = {
  id: string
  sku: string
  name: string
  category: string
  mainImage: string | null
  physicalQty: number
  availableQty: number
  stockMin: number
  avgCost: number
}

interface BatchCountModeProps {
  items: StockItem[]
  onDone: () => void
}

const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }

export function BatchCountMode({ items, onDone }: BatchCountModeProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  // productId → value typed by user ("" = not counted)
  const [counts, setCounts] = useState<Map<string, string>>(() => new Map())
  const [categoryFilter, setCategoryFilter] = useState("")
  const [search, setSearch] = useState("")

  const categories = Array.from(new Set(items.map((i) => i.category))).sort()

  const visibleItems = items.filter((item) => {
    if (categoryFilter && item.category !== categoryFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q)
    }
    return true
  })

  const filledCount = Array.from(counts.values()).filter((v) => v !== "").length

  function setCount(productId: string, value: string) {
    setCounts((prev) => {
      const next = new Map(prev)
      if (value === "") next.delete(productId)
      else next.set(productId, value)
      return next
    })
  }

  function handleSave() {
    const payload: Array<{ productId: string; quantity: number }> = []
    for (const [productId, value] of counts.entries()) {
      if (value === "") continue
      const qty = parseInt(value, 10)
      if (isNaN(qty) || qty < 0) continue
      payload.push({ productId, quantity: qty })
    }

    if (payload.length === 0) {
      toast.error("Preencha ao menos um campo de quantidade")
      return
    }

    startTransition(async () => {
      const result = await batchCountStock(payload)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      const { adjusted, total } = result.data
      if (adjusted === 0) {
        toast.success(
          `Contagem concluída — ${total} item${total !== 1 ? "s" : ""} verificado${total !== 1 ? "s" : ""}, nenhuma divergência`
        )
      } else {
        toast.success(
          `Contagem salva — ${adjusted} item${adjusted !== 1 ? "s" : ""} ajustado${adjusted !== 1 ? "s" : ""} de ${total} contado${total !== 1 ? "s" : ""}`
        )
      }
      router.refresh()
      onDone()
    })
  }

  return (
    <div className="p-6 bg-background min-h-full">
      {/* ── Header ── */}
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <p
            style={{
              ...mono,
              fontSize: "11px",
              color: "#9ba1a8",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            CONTAGEM EM LOTE
          </p>
          <h1
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 800,
              fontSize: "34px",
              color: "#16181c",
              lineHeight: 1,
              marginTop: "2px",
            }}
          >
            Estoque
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onDone}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-[#6b7178] border border-[#dde0e3] bg-white hover:bg-[#f5f6f7] transition-colors disabled:opacity-50"
          >
            <X size={14} />
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isPending || filledCount === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold text-white bg-[#16181c] hover:bg-[#2a2d32] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save size={14} />
            {isPending
              ? "Salvando..."
              : `Salvar contagem${filledCount > 0 ? ` (${filledCount})` : ""}`}
          </button>
        </div>
      </div>

      {/* ── Instruction banner ── */}
      <div
        className="mb-4 px-4 py-3 border border-[#b5652f]/30 bg-[#b5652f]/5"
        style={mono}
      >
        <p style={{ fontSize: "11px", color: "#8a4f24" }}>
          Preencha apenas os itens que foram contados fisicamente. Campos vazios serão ignorados.
          A quantidade digitada substituirá o saldo atual.
        </p>
      </div>

      {/* ── Filters ── */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Buscar por nome ou código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] h-9 px-3 text-[13px] border border-[#dde0e3] bg-white outline-none focus:border-[#16181c] text-[#16181c] placeholder:text-[#9ba1a8]"
        />
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 pl-3 pr-8 text-[13px] border border-[#dde0e3] bg-white outline-none focus:border-[#16181c] text-[#16181c] appearance-none cursor-pointer"
          >
            <option value="">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ba1a8] pointer-events-none"
          />
        </div>
      </div>

      {/* ── Count list ── */}
      <div className="bg-white border border-[#dde0e3]">
        {/* Desktop header */}
        <div
          className="hidden md:grid px-4 py-2.5 bg-[#f5f6f7]"
          style={{
            ...mono,
            fontSize: "11px",
            color: "#9ba1a8",
            gridTemplateColumns: "2fr 1fr 80px 120px",
          }}
        >
          <div>PRODUTO</div>
          <div>CATEGORIA</div>
          <div>SALDO ATUAL</div>
          <div>CONTAGEM FÍSICA</div>
        </div>

        {visibleItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2">
            <Package size={32} className="text-[#dde0e3]" />
            <p className="text-[13px] text-[#9ba1a8]">
              {search || categoryFilter ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
            </p>
          </div>
        ) : (
          visibleItems.map((item) => {
            const value = counts.get(item.id) ?? ""
            const isFilled = value !== ""
            const typed = isFilled ? parseInt(value, 10) : null
            const hasDivergence = typed !== null && typed !== item.physicalQty

            return (
              <div
                key={item.id}
                className={`border-t border-[#eceef0] ${isFilled ? "bg-[#f5fff8]" : ""}`}
              >
                {/* Desktop */}
                <div
                  className="hidden md:grid items-center px-4 py-3"
                  style={{ gridTemplateColumns: "2fr 1fr 80px 120px" }}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div className="relative w-8 h-8 shrink-0 bg-[#f5f6f7] border border-[#eceef0] overflow-hidden">
                      {item.mainImage ? (
                        <Image src={item.mainImage} alt="" fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={12} className="text-[#dde0e3]" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[14px] text-[#16181c] truncate">{item.name}</p>
                      <p style={{ ...mono, fontSize: "11px", color: "#9ba1a8" }}>{item.sku}</p>
                    </div>
                  </div>

                  <div className="text-[13px] text-[#6b7178] truncate pr-3">{item.category}</div>

                  <div style={{ ...mono, fontSize: "13px", color: "#9ba1a8" }}>
                    {item.physicalQty}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={value}
                      onChange={(e) => setCount(item.id, e.target.value)}
                      placeholder="—"
                      className="w-20 h-8 px-2 text-[13px] font-mono text-center border outline-none transition-colors
                        border-[#dde0e3] bg-white focus:border-[#16181c] placeholder:text-[#dde0e3]
                        [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    {hasDivergence && (
                      <span
                        style={{ ...mono, fontSize: "10px" }}
                        className={typed! > item.physicalQty ? "text-green-600" : "text-[#b23b32]"}
                      >
                        {typed! > item.physicalQty ? "+" : ""}
                        {typed! - item.physicalQty}
                      </span>
                    )}
                  </div>
                </div>

                {/* Mobile */}
                <div className="md:hidden px-4 py-3">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-[14px] text-[#16181c] truncate">{item.name}</p>
                      <p style={{ ...mono, fontSize: "11px", color: "#9ba1a8" }}>
                        {item.sku} · {item.category} · Atual: {item.physicalQty}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={value}
                        onChange={(e) => setCount(item.id, e.target.value)}
                        placeholder="—"
                        className="w-20 h-9 px-2 text-[13px] font-mono text-center border outline-none
                          border-[#dde0e3] bg-white focus:border-[#16181c] placeholder:text-[#dde0e3]
                          [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      {hasDivergence && (
                        <span
                          style={{ ...mono, fontSize: "10px" }}
                          className={typed! > item.physicalQty ? "text-green-600" : "text-[#b23b32]"}
                        >
                          {typed! > item.physicalQty ? "+" : ""}
                          {typed! - item.physicalQty}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {visibleItems.length > 0 && (
        <p style={mono} className="mt-3 text-[11px] text-[#9ba1a8]">
          {visibleItems.length} produto{visibleItems.length !== 1 ? "s" : ""}
          {filledCount > 0 && ` · ${filledCount} preenchido${filledCount !== 1 ? "s" : ""}`}
        </p>
      )}
    </div>
  )
}
