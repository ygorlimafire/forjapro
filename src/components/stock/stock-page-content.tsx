"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Warehouse, Package, ClipboardList } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { StatusBadge } from "@/components/ui/status-badge"
import { StockEntryDialog } from "@/components/stock/stock-entry-dialog"
import { StockAdjustDialog } from "@/components/stock/stock-adjust-dialog"
import { BatchCountMode } from "@/components/stock/batch-count-mode"

type StockItem = {
  id: string
  sku: string
  name: string
  category: string
  mainImage: string | null
  stockMin: number
  physicalQty: number
  reservedQty: number
  availableQty: number
  avgCost: number
}

const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-[#dde0e3] p-4">
      <p
        style={{
          ...mono,
          fontSize: "10px",
          color: "#9ba1a8",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
      <p
        style={{
          ...mono,
          fontWeight: 600,
          fontSize: "22px",
          color: "#16181c",
          marginTop: "6px",
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
    </div>
  )
}

interface StockPageContentProps {
  items: StockItem[]
  warehouseId: string
}

export function StockPageContent({ items, warehouseId }: StockPageContentProps) {
  const router = useRouter()
  const [isCountMode, setIsCountMode] = useState(false)

  if (isCountMode) {
    return (
      <BatchCountMode
        items={items}
        onDone={() => {
          setIsCountMode(false)
          router.refresh()
        }}
      />
    )
  }

  const lowStock = items.filter(
    (i) => i.stockMin > 0 && i.availableQty <= i.stockMin && i.availableQty > 0
  )
  const zeroStock = items.filter((i) => i.availableQty === 0)
  const totalValue = items.reduce((s, i) => s + i.physicalQty * i.avgCost, 0)

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
            CONTROLE
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
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setIsCountMode(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-[#16181c] border border-[#dde0e3] bg-white hover:bg-[#f5f6f7] transition-colors"
          >
            <ClipboardList size={14} />
            Contagem
          </button>
          <StockAdjustDialog warehouseId={warehouseId} />
          <StockEntryDialog warehouseId={warehouseId} />
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 mb-6" style={{ gap: "2px" }}>
        <KpiCard label="Valor em estoque" value={formatCurrency(totalValue)} />
        <KpiCard
          label="Estoque baixo"
          value={`${lowStock.length} produto${lowStock.length !== 1 ? "s" : ""}`}
        />
        <KpiCard
          label="Sem estoque"
          value={`${zeroStock.length} produto${zeroStock.length !== 1 ? "s" : ""}`}
        />
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-[#dde0e3]">
        <div
          className="hidden md:grid px-4 py-2.5 bg-[#f5f6f7]"
          style={{
            ...mono,
            fontSize: "11px",
            color: "#9ba1a8",
            gridTemplateColumns: "2fr 1fr 0.6fr 0.6fr 1fr 0.7fr",
          }}
        >
          <div>PRODUTO</div>
          <div>CATEGORIA</div>
          <div>FÍSICO</div>
          <div>DISP.</div>
          <div>CUSTO MÉDIO</div>
          <div>STATUS</div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2">
            <Warehouse size={32} className="text-[#dde0e3]" />
            <p className="text-[13px] text-[#9ba1a8]">Nenhum produto cadastrado</p>
          </div>
        ) : (
          items.map((item) => {
            const isZero = item.availableQty === 0
            const isLow = !isZero && item.stockMin > 0 && item.availableQty <= item.stockMin
            const stockStatus = isZero ? "ZERADO" : isLow ? "BAIXO" : "NORMAL"

            return (
              <div key={item.id} className="border-t border-[#eceef0] group">
                {/* Desktop */}
                <Link
                  href={`/estoque/${item.id}`}
                  className="hidden md:grid items-center px-4 py-3.5 text-[14px] hover:bg-[#f5f6f7] transition-colors"
                  style={{ gridTemplateColumns: "2fr 1fr 0.6fr 0.6fr 1fr 0.7fr" }}
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
                      <p className="font-semibold text-[#16181c] truncate">{item.name}</p>
                      <p style={{ ...mono, fontSize: "11px", color: "#9ba1a8" }}>{item.sku}</p>
                    </div>
                  </div>
                  <div className="text-[#6b7178] text-[13px] truncate pr-3">{item.category}</div>
                  <div style={{ ...mono, fontSize: "13px" }}>{item.physicalQty}</div>
                  <div
                    style={{
                      ...mono,
                      fontSize: "13px",
                      fontWeight: 600,
                      color: isZero ? "#b23b32" : isLow ? "#8a6d00" : "#16181c",
                    }}
                  >
                    {item.availableQty}
                  </div>
                  <div style={{ ...mono, fontSize: "13px" }}>
                    {item.avgCost > 0 ? formatCurrency(item.avgCost) : "—"}
                  </div>
                  <div>
                    <StatusBadge status={stockStatus} />
                  </div>
                </Link>

                {/* Mobile */}
                <Link
                  href={`/estoque/${item.id}`}
                  className="md:hidden block px-4 py-3.5 hover:bg-[#f5f6f7] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-[14px] text-[#16181c] truncate">
                      {item.name}
                    </span>
                    <StatusBadge status={stockStatus} />
                  </div>
                  <p style={mono} className="text-[11px] text-[#9ba1a8]">
                    {item.sku} · {item.category} · Disp: {item.availableQty}
                  </p>
                </Link>
              </div>
            )
          })
        )}
      </div>

      {items.length > 0 && (
        <p style={mono} className="mt-3 text-[11px] text-[#9ba1a8]">
          {items.length} produto{items.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  )
}
