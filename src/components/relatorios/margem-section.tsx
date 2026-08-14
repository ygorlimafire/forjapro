"use client"

import { useState } from "react"
import type { getMarginReport } from "@/actions/reports"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CsvExportButton } from "@/components/financial/csv-export-button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { formatCurrency } from "@/lib/utils"
import { TrendingUp, Tag, ChevronDown, ChevronUp } from "lucide-react"

type MargemData = Awaited<ReturnType<typeof getMarginReport>>

function Empty({ message }: { message: string }) {
  return (
    <div className="py-10 text-center text-sm text-muted-foreground">{message}</div>
  )
}

function marginColor(pct: number) {
  if (pct >= 30) return "#22c55e"
  if (pct >= 15) return "#f59e0b"
  return "#ef4444"
}

type SortKey = "marginPct" | "revenue" | "qty" | "discountValue"
type SortDir = "asc" | "desc"

export function MargemSection({ data }: { data: MargemData }) {
  const [productSort, setProductSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: "marginPct",
    dir: "desc",
  })

  function toggleSort(key: SortKey) {
    setProductSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" }
    )
  }

  const sortedProducts = [...data.byProduct].sort((a, b) => {
    const v = productSort.dir === "desc" ? b[productSort.key] - a[productSort.key] : a[productSort.key] - b[productSort.key]
    return v
  })

  const chartData = [...data.byProduct]
    .sort((a, b) => b.marginPct - a.marginPct)
    .slice(0, 10)
    .map((p) => ({ name: p.name.length > 20 ? p.name.slice(0, 18) + "…" : p.name, marginPct: p.marginPct }))

  const productCsvData = sortedProducts.map((p) => ({
    sku: p.sku,
    name: p.name,
    qty: p.qty,
    revenue: formatCurrency(p.revenue),
    cost: formatCurrency(p.cost),
    margin: formatCurrency(p.margin),
    marginPct: `${p.marginPct.toFixed(1)}%`,
    discountValue: formatCurrency(p.discountValue),
  }))

  const categoryCsvData = data.byCategory.map((c) => ({
    name: c.name,
    qty: c.qty,
    revenue: formatCurrency(c.revenue),
    margin: formatCurrency(c.margin),
    marginPct: `${c.marginPct.toFixed(1)}%`,
  }))

  const proposalCsvData = data.byProposal.map((p) => ({
    number: p.number,
    totalAmount: formatCurrency(p.totalAmount),
    estimatedMargin: formatCurrency(p.estimatedMargin),
    estimatedMarginPct: `${p.estimatedMarginPct.toFixed(1)}%`,
  }))

  const SortIcon = ({ k }: { k: SortKey }) =>
    productSort.key === k ? (
      productSort.dir === "desc" ? (
        <ChevronDown size={12} className="inline ml-0.5" />
      ) : (
        <ChevronUp size={12} className="inline ml-0.5" />
      )
    ) : null

  if (data.byProduct.length === 0) {
    return <Empty message="Nenhuma proposta aprovada no período" />
  }

  return (
    <div className="space-y-6">
      {/* Chart: top 10 produtos por margem */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Top 10 Produtos por Margem %</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 48, bottom: 0, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `${v.toFixed(0)}%`}
                domain={[0, "auto"]}
              />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
                formatter={(v: unknown) => [`${Number(v).toFixed(1)}%`, "Margem"]}
              />
              <Bar dataKey="marginPct" radius={[0, 3, 3, 0]} maxBarSize={20}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={marginColor(entry.marginPct)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Por produto - tabela */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Margem por Produto</CardTitle>
            <CsvExportButton
              data={productCsvData}
              filename="margem-por-produto.csv"
              columns={[
                { key: "sku", label: "SKU" },
                { key: "name", label: "Produto" },
                { key: "qty", label: "Qtd" },
                { key: "revenue", label: "Receita" },
                { key: "cost", label: "Custo" },
                { key: "margin", label: "Margem" },
                { key: "marginPct", label: "Margem %" },
                { key: "discountValue", label: "Desconto dado" },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">Produto</th>
                  <th
                    className="text-right py-2 text-xs text-muted-foreground font-medium cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("qty")}
                  >
                    Qtd <SortIcon k="qty" />
                  </th>
                  <th
                    className="text-right py-2 text-xs text-muted-foreground font-medium cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("revenue")}
                  >
                    Receita <SortIcon k="revenue" />
                  </th>
                  <th
                    className="text-right py-2 text-xs text-muted-foreground font-medium cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("marginPct")}
                  >
                    Margem % <SortIcon k="marginPct" />
                  </th>
                  <th
                    className="text-right py-2 text-xs text-muted-foreground font-medium cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("discountValue")}
                  >
                    Desconto dado <SortIcon k="discountValue" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map((p) => (
                  <tr key={p.productId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.sku}</p>
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-muted-foreground">{p.qty}</td>
                    <td className="py-2.5 text-right tabular-nums">{formatCurrency(p.revenue)}</td>
                    <td className="py-2.5 text-right tabular-nums">
                      <span
                        className={`font-medium ${
                          p.marginPct >= 30
                            ? "text-green-600 dark:text-green-400"
                            : p.marginPct >= 15
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {p.marginPct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                      {p.discountValue > 0 ? formatCurrency(p.discountValue) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por categoria */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Por Categoria</CardTitle>
              </div>
              <CsvExportButton
                data={categoryCsvData}
                filename="margem-por-categoria.csv"
                columns={[
                  { key: "name", label: "Categoria" },
                  { key: "qty", label: "Qtd" },
                  { key: "revenue", label: "Receita" },
                  { key: "margin", label: "Margem" },
                  { key: "marginPct", label: "Margem %" },
                ]}
              />
            </div>
          </CardHeader>
          <CardContent>
            {data.byCategory.length === 0 ? (
              <Empty message="Sem dados" />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-xs text-muted-foreground font-medium">Categoria</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium">Receita</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium">Margem %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byCategory.map((c, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 font-medium">{c.name}</td>
                      <td className="py-2.5 text-right tabular-nums">{formatCurrency(c.revenue)}</td>
                      <td className="py-2.5 text-right tabular-nums">
                        <span
                          className={`font-medium ${
                            c.marginPct >= 30
                              ? "text-green-600 dark:text-green-400"
                              : c.marginPct >= 15
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {c.marginPct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Por proposta */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Por Proposta</CardTitle>
              <CsvExportButton
                data={proposalCsvData}
                filename="margem-por-proposta.csv"
                columns={[
                  { key: "number", label: "Proposta" },
                  { key: "totalAmount", label: "Valor total" },
                  { key: "estimatedMargin", label: "Margem est." },
                  { key: "estimatedMarginPct", label: "Margem %" },
                ]}
              />
            </div>
          </CardHeader>
          <CardContent>
            {data.byProposal.length === 0 ? (
              <Empty message="Sem dados" />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-xs text-muted-foreground font-medium">Proposta</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium">Valor</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium">Margem %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byProposal.map((p, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 font-medium">{p.number}</td>
                      <td className="py-2.5 text-right tabular-nums">{formatCurrency(p.totalAmount)}</td>
                      <td className="py-2.5 text-right tabular-nums">
                        <span
                          className={`font-medium ${
                            p.estimatedMarginPct >= 30
                              ? "text-green-600 dark:text-green-400"
                              : p.estimatedMarginPct >= 15
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {p.estimatedMarginPct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Impacto de desconto */}
      {data.discountImpact.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Impacto de Desconto na Margem</CardTitle>
              <CsvExportButton
                data={data.discountImpact.map((d) => ({
                  name: d.name,
                  sku: d.sku,
                  discountValue: formatCurrency(d.discountValue),
                  marginWithDiscount: formatCurrency(d.marginWithDiscount),
                  marginWithoutDiscount: formatCurrency(d.marginWithoutDiscount),
                }))}
                filename="impacto-desconto.csv"
                columns={[
                  { key: "name", label: "Produto" },
                  { key: "sku", label: "SKU" },
                  { key: "discountValue", label: "Valor descontado" },
                  { key: "marginWithDiscount", label: "Margem c/ desconto" },
                  { key: "marginWithoutDiscount", label: "Margem s/ desconto" },
                ]}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-xs text-muted-foreground font-medium">Produto</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium">Desconto dado</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium">Margem s/ desconto</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium">Margem c/ desconto</th>
                  </tr>
                </thead>
                <tbody>
                  {data.discountImpact.map((d, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5">
                        <p className="font-medium">{d.name}</p>
                        <p className="text-xs text-muted-foreground">{d.sku}</p>
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-amber-600 dark:text-amber-400">
                        {formatCurrency(d.discountValue)}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                        {formatCurrency(d.marginWithoutDiscount)}
                      </td>
                      <td className="py-2.5 text-right tabular-nums font-medium">
                        {formatCurrency(d.marginWithDiscount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
