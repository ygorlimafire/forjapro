import { notFound } from "next/navigation"
import { getStockDetail } from "@/actions/stock"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Package, Tag } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { StockEntryDialog } from "@/components/stock/stock-entry-dialog"
import { StockAdjustDialog } from "@/components/stock/stock-adjust-dialog"
type PageProps = { params: Promise<{ productId: string }>; searchParams: Promise<Record<string, string | string[]>> }

type MovementType = "ENTRADA" | "SAIDA" | "AJUSTE" | "DEVOLUCAO" | "PERDA" | "RESERVA" | "CANCELAMENTO_RESERVA"
type StockUnitStatus = "EM_ESTOQUE" | "VENDIDO" | "GARANTIA" | "PERDA"

const MOVEMENT_LABEL: Record<MovementType, string> = {
  ENTRADA: "Entrada",
  SAIDA: "Saída",
  AJUSTE: "Ajuste",
  DEVOLUCAO: "Devolução",
  PERDA: "Perda",
  RESERVA: "Reserva",
  CANCELAMENTO_RESERVA: "Cancelamento de Reserva",
}

const MOVEMENT_COLOR: Record<MovementType, string> = {
  ENTRADA: "text-green-600",
  SAIDA: "text-red-600",
  AJUSTE: "text-blue-600",
  DEVOLUCAO: "text-green-600",
  PERDA: "text-red-600",
  RESERVA: "text-yellow-600",
  CANCELAMENTO_RESERVA: "text-yellow-600",
}

const MOVEMENT_SIGN: Record<MovementType, string> = {
  ENTRADA: "+",
  SAIDA: "-",
  AJUSTE: "±",
  DEVOLUCAO: "+",
  PERDA: "-",
  RESERVA: "~",
  CANCELAMENTO_RESERVA: "~",
}

const UNIT_STATUS_LABEL: Record<StockUnitStatus, string> = {
  EM_ESTOQUE: "Em estoque",
  VENDIDO: "Vendido",
  GARANTIA: "Em garantia",
  PERDA: "Perda",
}

const UNIT_STATUS_COLOR: Record<StockUnitStatus, string> = {
  EM_ESTOQUE: "text-green-700 bg-green-50 border-green-200",
  VENDIDO: "text-muted-foreground bg-muted border-border",
  GARANTIA: "text-blue-700 bg-blue-50 border-blue-200",
  PERDA: "text-red-700 bg-red-50 border-red-200",
}

export default async function EstoqueProductPage({ params }: PageProps) {
  const { productId } = await params
  const data = await getStockDetail(productId)
  if (!data.product) notFound()

  const { product, stock, movements, units, warehouseId } = data
  const isLow = (product.stockMin ?? 0) > 0 && (stock?.availableQty ?? 0) <= (product.stockMin ?? 0)
  const isZero = (stock?.availableQty ?? 0) === 0

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/estoque" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={15} />
          Estoque
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-lg border bg-muted shrink-0 overflow-hidden">
            {product.mainImage ? (
              <Image src={product.mainImage} alt="" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package size={22} className="text-muted-foreground/30" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{product.name}</h1>
              {isZero && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">Zerado</span>
              )}
              {!isZero && isLow && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">Estoque baixo</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{product.sku} · {product.category.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <StockAdjustDialog warehouseId={warehouseId} productId={productId} />
          <StockEntryDialog warehouseId={warehouseId} productId={productId} />
        </div>
      </div>

      {/* Stock KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Físico", value: stock?.physicalQty ?? 0, sub: "total em estoque" },
          { label: "Reservado", value: stock?.reservedQty ?? 0, sub: "em pedidos ativos" },
          { label: "Disponível", value: stock?.availableQty ?? 0, sub: "para novos pedidos", highlight: isZero ? "red" : isLow ? "yellow" : undefined },
          { label: "Mínimo", value: product.stockMin ?? 0, sub: "alerta de reposição" },
        ].map((kpi) => (
          <Card key={kpi.label} className={kpi.highlight === "red" ? "border-red-300" : kpi.highlight === "yellow" ? "border-yellow-300" : ""}>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className={`text-2xl font-bold mt-1 ${kpi.highlight === "red" ? "text-red-600" : kpi.highlight === "yellow" ? "text-yellow-600" : ""}`}>
                {kpi.value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {stock?.avgCost && Number(stock.avgCost) > 0 && (
        <p className="text-sm text-muted-foreground">
          Custo médio: <span className="font-medium text-foreground">{formatCurrency(Number(stock.avgCost))}</span>
          {" "}· Valor total em estoque: <span className="font-medium text-foreground">{formatCurrency((stock.physicalQty ?? 0) * Number(stock.avgCost))}</span>
        </p>
      )}

      {/* Movement history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Histórico de Movimentações ({movements.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma movimentação registrada</p>
          ) : (
            <div className="space-y-0">
              {movements.map((mv, i) => (
                <div key={mv.id} className={`flex items-start gap-4 py-3 ${i < movements.length - 1 ? "border-b" : ""}`}>
                  <div className="shrink-0 w-20 text-right">
                    <p className={`text-sm font-semibold ${MOVEMENT_COLOR[mv.type]}`}>
                      {MOVEMENT_SIGN[mv.type]}{mv.quantity}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{MOVEMENT_LABEL[mv.type]}</span>
                      {mv.serialNumber && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-muted font-mono">{mv.serialNumber}</span>
                      )}
                      {mv.referenceId && (
                        <span className="text-xs text-muted-foreground">· ref: {mv.referenceId.slice(0, 8)}</span>
                      )}
                    </div>
                    {mv.reason && <p className="text-xs text-muted-foreground mt-0.5">{mv.reason}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {mv.user.name} · {formatDateTime(mv.createdAt)}
                    </p>
                  </div>
                  {mv.unitCost && (
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">{formatCurrency(Number(mv.unitCost))}/un</p>
                      {mv.totalCost && <p className="text-xs font-medium">{formatCurrency(Number(mv.totalCost))}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Serial number units */}
      {units.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Tag size={14} />
              Unidades Rastreadas ({units.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {units.map((unit) => {
                const customerName = unit.customer?.companyName || unit.customer?.tradeName || unit.customer?.document
                return (
                  <div key={unit.id} className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${UNIT_STATUS_COLOR[unit.status]}`}>
                        {UNIT_STATUS_LABEL[unit.status]}
                      </span>
                      <span className="font-mono text-sm">{unit.serialNumber}</span>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {unit.soldAt && (
                        <p>Vendido em {formatDate(unit.soldAt)}{customerName ? ` · ${customerName}` : ""}</p>
                      )}
                      {unit.status === "EM_ESTOQUE" && (
                        <p>Entrada em {formatDate(unit.createdAt)}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
