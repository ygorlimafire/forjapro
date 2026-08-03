import { getStockList } from "@/actions/stock"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Warehouse, AlertTriangle, ArrowRight, Package } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { StockEntryDialog } from "@/components/stock/stock-entry-dialog"
import { StockAdjustDialog } from "@/components/stock/stock-adjust-dialog"
import { getWarehouses } from "@/actions/stock"

export default async function EstoquePage() {
  const [items, warehouses] = await Promise.all([getStockList(), getWarehouses()])

  const lowStock = items.filter((i) => i.stockMin > 0 && i.availableQty <= i.stockMin && i.availableQty > 0)
  const zeroStock = items.filter((i) => i.availableQty === 0)
  const totalValue = items.reduce((s, i) => s + i.physicalQty * i.avgCost, 0)
  const defaultWarehouseId = warehouses[0]?.id ?? ""

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Estoque</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{items.length} produtos cadastrados</p>
        </div>
        <div className="flex gap-2">
          <StockAdjustDialog warehouseId={defaultWarehouseId} />
          <StockEntryDialog warehouseId={defaultWarehouseId} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor em estoque</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totalValue)}</p>
                <p className="text-xs text-muted-foreground mt-1">custo médio ponderado</p>
              </div>
              <Warehouse size={20} className="text-blue-500 mt-1" />
            </div>
          </CardContent>
        </Card>
        <Card className={lowStock.length > 0 ? "border-yellow-300 dark:border-yellow-900/70" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estoque baixo</p>
                <p className="text-2xl font-bold mt-1">{lowStock.length}</p>
                <p className="text-xs text-muted-foreground mt-1">produto{lowStock.length !== 1 ? "s" : ""} abaixo do mínimo</p>
              </div>
              <AlertTriangle size={20} className={lowStock.length > 0 ? "text-yellow-500 mt-1" : "text-muted-foreground/30 mt-1"} />
            </div>
          </CardContent>
        </Card>
        <Card className={zeroStock.length > 0 ? "border-red-300 dark:border-red-900/70" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sem estoque</p>
                <p className="text-2xl font-bold mt-1">{zeroStock.length}</p>
                <p className="text-xs text-muted-foreground mt-1">produto{zeroStock.length !== 1 ? "s" : ""} zerados</p>
              </div>
              <Package size={20} className={zeroStock.length > 0 ? "text-red-500 mt-1" : "text-muted-foreground/30 mt-1"} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product list */}
      <div className="space-y-1">
        {/* Header */}
        <div className="hidden md:grid grid-cols-[1fr_100px_90px_90px_90px_110px_40px] gap-4 px-4 py-2 text-xs font-medium text-muted-foreground">
          <span>Produto</span>
          <span className="text-right">Físico</span>
          <span className="text-right">Reservado</span>
          <span className="text-right">Disponível</span>
          <span className="text-right">Mínimo</span>
          <span className="text-right">Custo médio</span>
          <span />
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center">
              <Warehouse size={40} className="mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">Nenhum produto cadastrado</p>
            </CardContent>
          </Card>
        ) : (
          items.map((item) => {
            const isZero = item.availableQty === 0
            const isLow = !isZero && item.stockMin > 0 && item.availableQty <= item.stockMin

            return (
              <Link key={item.id} href={`/estoque/${item.id}`}>
                <div className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_100px_90px_90px_90px_110px_40px] gap-4 items-center px-4 py-3 rounded-lg border bg-card hover:bg-accent/40 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-9 h-9 rounded border bg-muted shrink-0 overflow-hidden">
                      {item.mainImage ? (
                        <Image src={item.mainImage} alt="" fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={14} className="text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        {isZero && (
                          <span className="shrink-0 text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                            Zerado
                          </span>
                        )}
                        {isLow && (
                          <span className="shrink-0 text-xs px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/50">
                            Baixo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.sku} · {item.category}</p>
                    </div>
                  </div>

                  {/* Mobile: just show available */}
                  <div className="md:hidden text-right">
                    <p className={`font-semibold text-sm ${isZero ? "text-red-600" : isLow ? "text-yellow-600" : ""}`}>
                      {item.availableQty}
                    </p>
                    <p className="text-xs text-muted-foreground">disponível</p>
                  </div>

                  {/* Desktop columns */}
                  <p className="hidden md:block text-right text-sm">{item.physicalQty}</p>
                  <p className="hidden md:block text-right text-sm text-muted-foreground">{item.reservedQty}</p>
                  <p className={`hidden md:block text-right text-sm font-semibold ${isZero ? "text-red-600" : isLow ? "text-yellow-600" : ""}`}>
                    {item.availableQty}
                  </p>
                  <p className="hidden md:block text-right text-sm text-muted-foreground">{item.stockMin || "—"}</p>
                  <p className="hidden md:block text-right text-sm">{item.avgCost > 0 ? formatCurrency(item.avgCost) : "—"}</p>

                  <ArrowRight size={15} className="hidden md:block text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
