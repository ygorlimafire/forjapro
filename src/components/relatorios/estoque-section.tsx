"use client"

import type { getStockReport } from "@/actions/reports"
import type { getStockList } from "@/actions/stock"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CsvExportButton } from "@/components/financial/csv-export-button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency } from "@/lib/utils"
import { Package, ArrowDown, ArrowUp, AlertTriangle } from "lucide-react"

type EstoqueData = Awaited<ReturnType<typeof getStockReport>>
type SnapshotItem = Awaited<ReturnType<typeof getStockList>>[number]

function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
  warn,
}: {
  title: string
  value: string
  sub?: string
  icon: React.ElementType
  accent?: boolean
  warn?: boolean
}) {
  const colorClass = accent
    ? "text-green-600 dark:text-green-400"
    : warn
      ? "text-amber-600 dark:text-amber-400"
      : ""
  const iconClass = accent
    ? "text-green-500"
    : warn
      ? "text-amber-500"
      : "text-muted-foreground"
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <Icon size={14} className={iconClass} />
        </div>
        <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function Empty({ message }: { message: string }) {
  return (
    <div className="py-10 text-center text-sm text-muted-foreground">{message}</div>
  )
}

const TYPE_LABEL: Record<string, string> = {
  ENTRADA: "Entrada",
  SAIDA: "Saída",
  AJUSTE: "Ajuste",
  RESERVA: "Reserva",
  LIBERACAO: "Liberação",
}

export function EstoqueSection({
  data,
  snapshot,
}: {
  data: EstoqueData
  snapshot: SnapshotItem[]
}) {
  const totalValue = snapshot.reduce((s, p) => s + p.physicalQty * p.avgCost, 0)
  const entradaType = data.byType.find((t) => t.type === "ENTRADA")
  const saidaType = data.byType.find((t) => t.type === "SAIDA")
  const ajusteType = data.byType.find((t) => t.type === "AJUSTE")
  const lowStock = snapshot.filter((p) => p.stockMin != null && p.physicalQty <= p.stockMin && p.physicalQty > 0)
  const zeroStock = snapshot.filter((p) => p.physicalQty === 0)

  const snapshotCsvData = snapshot.map((p) => ({
    sku: p.sku,
    name: p.name,
    category: p.category,
    physicalQty: p.physicalQty,
    avgCost: formatCurrency(p.avgCost),
    totalValue: formatCurrency(p.physicalQty * p.avgCost),
  }))

  const movementsCsvData = data.movements.map((m) => ({
    type: TYPE_LABEL[m.type] ?? m.type,
    quantity: m.quantity,
    unitCost: formatCurrency(m.unitCost),
    totalCost: formatCurrency(m.totalCost),
    reason: m.reason ?? "",
    user: m.userName,
    date: new Date(m.createdAt).toLocaleDateString("pt-BR"),
  }))

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          title="Valor total em estoque"
          value={formatCurrency(totalValue)}
          sub={`${snapshot.length} produtos ativos`}
          icon={Package}
          accent={totalValue > 0}
        />
        <KpiCard
          title="Entradas (período)"
          value={String(entradaType?.quantity ?? 0)}
          sub={`${entradaType?.count ?? 0} movimentações`}
          icon={ArrowDown}
        />
        <KpiCard
          title="Saídas (período)"
          value={String(saidaType?.quantity ?? 0)}
          sub={`${saidaType?.count ?? 0} movimentações`}
          icon={ArrowUp}
        />
        <KpiCard
          title="Produtos com estoque baixo"
          value={String(lowStock.length + zeroStock.length)}
          sub={`${zeroStock.length} zerados, ${lowStock.length} abaixo do mínimo`}
          icon={AlertTriangle}
          warn={lowStock.length + zeroStock.length > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart: entradas vs saídas por mês */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Movimentações por mês</CardTitle>
          </CardHeader>
          <CardContent>
            {data.monthlySeries.length === 0 ? (
              <Empty message="Nenhuma movimentação no período" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={data.monthlySeries}
                  margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={28} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="entrada" name="Entrada" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="saida" name="Saída" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Ajustes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ajustes de estoque</CardTitle>
          </CardHeader>
          <CardContent>
            {data.adjustments.length === 0 ? (
              <Empty message="Nenhum ajuste no período" />
            ) : (
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {data.adjustments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-2 text-sm py-1.5 border-b last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-muted-foreground text-xs">{a.reason ?? "Sem motivo"}</p>
                      <p className="text-xs text-muted-foreground">{a.userName} · {new Date(a.createdAt).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <span
                      className={`font-medium tabular-nums shrink-0 ${
                        a.quantity >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {a.quantity >= 0 ? "+" : ""}{a.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {ajusteType && ajusteType.count > data.adjustments.length && (
              <p className="text-xs text-muted-foreground mt-2">
                Exibindo {data.adjustments.length} de {ajusteType.count} ajustes. Exporte para ver todos.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Snapshot de estoque */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Snapshot do Estoque</CardTitle>
            <CsvExportButton
              data={snapshotCsvData}
              filename="estoque-snapshot.csv"
              columns={[
                { key: "sku", label: "SKU" },
                { key: "name", label: "Produto" },
                { key: "category", label: "Categoria" },
                { key: "physicalQty", label: "Qtd física" },
                { key: "avgCost", label: "Custo médio" },
                { key: "totalValue", label: "Valor total" },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent>
          {snapshot.length === 0 ? (
            <Empty message="Nenhum produto em estoque" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-xs text-muted-foreground font-medium">Produto</th>
                    <th className="text-left py-2 text-xs text-muted-foreground font-medium">Categoria</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium">Qtd física</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium">Custo médio</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium">Valor total</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.map((p) => {
                    const isLow = p.stockMin != null && p.physicalQty <= p.stockMin && p.physicalQty > 0
                    const isZero = p.physicalQty === 0
                    return (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-2.5">
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.sku}</p>
                        </td>
                        <td className="py-2.5 text-muted-foreground text-xs">{p.category}</td>
                        <td className="py-2.5 text-right tabular-nums">
                          <span
                            className={
                              isZero
                                ? "text-red-600 dark:text-red-400 font-medium"
                                : isLow
                                  ? "text-amber-600 dark:text-amber-400 font-medium"
                                  : ""
                            }
                          >
                            {p.physicalQty}
                            {isZero && <span className="ml-1 text-xs">(zero)</span>}
                            {!isZero && isLow && <span className="ml-1 text-xs">(baixo)</span>}
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-muted-foreground tabular-nums">
                          {formatCurrency(p.avgCost)}
                        </td>
                        <td className="py-2.5 text-right font-medium tabular-nums">
                          {formatCurrency(p.physicalQty * p.avgCost)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Movimentações recentes */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Movimentações no período</CardTitle>
            <CsvExportButton
              data={movementsCsvData}
              filename="movimentacoes-estoque.csv"
              columns={[
                { key: "type", label: "Tipo" },
                { key: "quantity", label: "Qtd" },
                { key: "unitCost", label: "Custo unit." },
                { key: "totalCost", label: "Custo total" },
                { key: "reason", label: "Motivo" },
                { key: "user", label: "Usuário" },
                { key: "date", label: "Data" },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent>
          {data.movements.length === 0 ? (
            <Empty message="Nenhuma movimentação no período" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-xs text-muted-foreground font-medium">Tipo</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium">Qtd</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium">Custo total</th>
                    <th className="text-left py-2 text-xs text-muted-foreground font-medium">Motivo</th>
                    <th className="text-left py-2 text-xs text-muted-foreground font-medium">Usuário</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {data.movements.map((m) => (
                    <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-2">
                        <span
                          className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                            m.type === "ENTRADA"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : m.type === "SAIDA"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}
                        >
                          {TYPE_LABEL[m.type] ?? m.type}
                        </span>
                      </td>
                      <td className="py-2 text-right tabular-nums">{m.quantity}</td>
                      <td className="py-2 text-right tabular-nums">{formatCurrency(m.totalCost)}</td>
                      <td className="py-2 text-muted-foreground text-xs truncate max-w-[180px]">
                        {m.reason ?? "—"}
                      </td>
                      <td className="py-2 text-muted-foreground text-xs">{m.userName}</td>
                      <td className="py-2 text-right text-muted-foreground text-xs tabular-nums">
                        {new Date(m.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.movements.length === 100 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Exibindo as 100 movimentações mais recentes. Exporte para ver todas.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
