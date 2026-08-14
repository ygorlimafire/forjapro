"use client"

import type { getCRMReport } from "@/actions/reports"
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
import { Funnel, Clock, TrendingUp } from "lucide-react"

type FunilData = Awaited<ReturnType<typeof getCRMReport>>

function Empty({ message }: { message: string }) {
  return (
    <div className="py-10 text-center text-sm text-muted-foreground">{message}</div>
  )
}

function ConvBadge({ pct }: { pct: number }) {
  const cls =
    pct >= 50
      ? "text-green-600 dark:text-green-400 font-medium"
      : pct >= 25
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400"
  return <span className={cls}>{pct.toFixed(1)}%</span>
}

function DeltaBadge({ delta }: { delta: number }) {
  const sign = delta > 0 ? "+" : ""
  const cls =
    delta > 0
      ? "text-green-600 dark:text-green-400"
      : "text-red-600 dark:text-red-400"
  return (
    <span className={`ml-1 text-xs ${cls}`} title="Diferença: valor vs quantidade">
      ({sign}{delta.toFixed(0)}pp)
    </span>
  )
}

export function FunilSection({ data }: { data: FunilData }) {
  const totalOpps = data.byStage.reduce((s, st) => s + st.count, 0)
  const totalValue = data.byStage.reduce((s, st) => s + st.value, 0)
  const wonStage = data.byStage.find((s) => s.isWon)
  const lostStage = data.byStage.find((s) => s.isLost)

  const stageCsvData = data.byStage.map((s) => ({
    stage: s.stageName,
    count: s.count,
    value: formatCurrency(s.value),
  }))

  const convCsvData = data.conversionRates.map((c) => ({
    stage: c.stageName,
    entered: c.entered,
    moved: c.moved,
    conversionRate: `${c.conversionRate.toFixed(1)}%`,
    enteredValue: formatCurrency(c.enteredValue),
    movedValue: formatCurrency(c.movedValue),
    conversionRateValue: `${c.conversionRateValue.toFixed(1)}%`,
  }))

  const avgDaysCsvData = data.stageAvgDays
    .filter((s) => s.avgDays > 0)
    .map((s) => ({
      stage: s.stageName,
      avgDays: s.avgDays.toFixed(1),
    }))

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground font-medium">Total de oportunidades</p>
              <Funnel size={14} className="text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{totalOpps}</p>
            <p className="text-xs text-muted-foreground mt-0.5">em aberto</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground font-medium">Valor total no funil</p>
              <TrendingUp size={14} className="text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalValue)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">todas as etapas</p>
          </CardContent>
        </Card>
        {wonStage && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground font-medium">Ganhas</p>
                <TrendingUp size={14} className="text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {wonStage.count}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(wonStage.value)}</p>
              <div className="mt-2 pt-2 border-t space-y-0.5">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {totalOpps > 0 ? ((wonStage.count / totalOpps) * 100).toFixed(1) : "0.0"}%
                  </span>
                  {" "}das oportunidades
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {totalValue > 0 ? ((wonStage.value / totalValue) * 100).toFixed(1) : "0.0"}%
                  </span>
                  {" "}do valor total
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        {lostStage && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground font-medium">Perdidas</p>
                <TrendingUp size={14} className="text-red-500" />
              </div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {lostStage.count}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(lostStage.value)}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Chart: oportunidades por etapa */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Oportunidades por Etapa</CardTitle>
            <CsvExportButton
              data={stageCsvData}
              filename="funil-por-etapa.csv"
              columns={[
                { key: "stage", label: "Etapa" },
                { key: "count", label: "Qtd" },
                { key: "value", label: "Valor" },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent>
          {data.byStage.length === 0 ? (
            <Empty message="Nenhuma oportunidade registrada" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={data.byStage}
                layout="vertical"
                margin={{ top: 4, right: 48, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="stageName"
                  tick={{ fontSize: 10 }}
                  width={110}
                />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  formatter={(v: unknown) =>
                    [`${v} oportunidade${Number(v) !== 1 ? "s" : ""}`, "Qtd"]
                  }
                />
                <Bar dataKey="count" radius={[0, 3, 3, 0]} maxBarSize={20}>
                  {data.byStage.map((entry, i) => (
                    <Cell key={i} fill={entry.stageColor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Taxas de conversão entre etapas */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Conversão entre Etapas</CardTitle>
              </div>
              <CsvExportButton
                data={convCsvData}
                filename="conversao-etapas.csv"
                columns={[
                  { key: "stage", label: "Etapa" },
                  { key: "entered", label: "Entradas (qtd)" },
                  { key: "moved", label: "Avançaram (qtd)" },
                  { key: "conversionRate", label: "Conv. qtd %" },
                  { key: "enteredValue", label: "Valor entrado" },
                  { key: "movedValue", label: "Valor avançou" },
                  { key: "conversionRateValue", label: "Conv. valor %" },
                ]}
              />
            </div>
          </CardHeader>
          <CardContent>
            {data.conversionRates.every((c) => c.entered === 0) ? (
              <Empty message="Nenhuma movimentação no período" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-xs text-muted-foreground font-medium" rowSpan={2}>
                        Etapa
                      </th>
                      <th className="text-center py-1 text-xs text-muted-foreground font-medium border-b border-dashed" colSpan={2}>
                        Quantidade
                      </th>
                      <th className="text-center py-1 text-xs text-muted-foreground font-medium border-b border-dashed border-l" colSpan={2}>
                        Valor
                      </th>
                    </tr>
                    <tr className="border-b">
                      <th className="text-right pb-2 text-xs text-muted-foreground font-medium">Entradas</th>
                      <th className="text-right pb-2 text-xs text-muted-foreground font-medium">Conv. %</th>
                      <th className="text-right pb-2 text-xs text-muted-foreground font-medium border-l">Entrou</th>
                      <th className="text-right pb-2 text-xs text-muted-foreground font-medium">Conv. %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.conversionRates
                      .filter((c) => c.entered > 0)
                      .map((c, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 font-medium">{c.stageName}</td>
                          <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                            {c.entered}→{c.moved}
                          </td>
                          <td className="py-2.5 text-right tabular-nums">
                            <ConvBadge pct={c.conversionRate} />
                          </td>
                          <td className="py-2.5 text-right tabular-nums text-muted-foreground border-l">
                            {formatCurrency(c.enteredValue)}
                          </td>
                          <td className="py-2.5 text-right tabular-nums">
                            <ConvBadge pct={c.conversionRateValue} />
                            {Math.abs(c.conversionRateValue - c.conversionRate) >= 5 && (
                              <DeltaBadge delta={c.conversionRateValue - c.conversionRate} />
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tempo médio por etapa */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Tempo Médio por Etapa</CardTitle>
              </div>
              <CsvExportButton
                data={avgDaysCsvData}
                filename="tempo-medio-etapas.csv"
                columns={[
                  { key: "stage", label: "Etapa" },
                  { key: "avgDays", label: "Dias médios" },
                ]}
              />
            </div>
          </CardHeader>
          <CardContent>
            {data.stageAvgDays.every((s) => s.avgDays === 0) ? (
              <Empty message="Nenhuma movimentação no período" />
            ) : (
              <div className="space-y-3 mt-2">
                {data.stageAvgDays
                  .filter((s) => s.avgDays > 0)
                  .map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium truncate">{s.stageName}</span>
                          <span className="text-xs tabular-nums text-muted-foreground shrink-0 ml-2">
                            {s.avgDays.toFixed(1)}d
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{
                              width: `${Math.min(100, (s.avgDays / Math.max(...data.stageAvgDays.map((x) => x.avgDays))) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
