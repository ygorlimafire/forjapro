"use client"

import type { getFinancialReport } from "@/actions/reports"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CsvExportButton } from "@/components/financial/csv-export-button"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency } from "@/lib/utils"
import { DollarSign, TrendingDown, AlertCircle, BarChart2 } from "lucide-react"

type FinanceiroData = Awaited<ReturnType<typeof getFinancialReport>>

function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
  danger,
}: {
  title: string
  value: string
  sub?: string
  icon: React.ElementType
  accent?: boolean
  danger?: boolean
}) {
  const colorClass = accent
    ? "text-green-600 dark:text-green-400"
    : danger
      ? "text-red-600 dark:text-red-400"
      : ""
  const iconClass = accent
    ? "text-green-500"
    : danger
      ? "text-red-500"
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

export function FinanceiroSection({ data }: { data: FinanceiroData }) {
  const overdueCsvData = data.overdue.items.map((r) => ({
    customer: r.customer,
    amount: formatCurrency(r.amount),
    dueDate: new Date(r.dueDate).toLocaleDateString("pt-BR"),
  }))

  return (
    <div className="space-y-6">
      {/* KPI row 1: receita e margem */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          title="Receita bruta (período)"
          value={formatCurrency(data.margin.grossRevenue)}
          sub="propostas pagas no período"
          icon={DollarSign}
          accent={data.margin.grossRevenue > 0}
        />
        <KpiCard
          title="CMV"
          value={formatCurrency(data.margin.cogsValue)}
          sub="custo dos produtos vendidos"
          icon={BarChart2}
        />
        <KpiCard
          title="Margem bruta"
          value={`${data.margin.grossMarginPct.toFixed(1)}%`}
          sub={formatCurrency(data.margin.grossMargin)}
          icon={TrendingDown}
          accent={data.margin.grossMarginPct >= 20}
          danger={data.margin.grossMarginPct < 10}
        />
        <KpiCard
          title="Resultado líquido"
          value={`${data.margin.netResultPct.toFixed(1)}%`}
          sub={formatCurrency(data.margin.netResult)}
          icon={DollarSign}
          accent={data.margin.netResult > 0}
          danger={data.margin.netResult < 0}
        />
      </div>

      {/* KPI inadimplência */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard
          title="Inadimplência total"
          value={formatCurrency(data.overdue.total)}
          sub="títulos vencidos e não pagos"
          icon={AlertCircle}
          danger={data.overdue.total > 0}
        />
        <KpiCard
          title="% sobre total a receber"
          value={`${data.overdue.pct.toFixed(1)}%`}
          sub="do total de contas a receber"
          icon={AlertCircle}
          danger={data.overdue.pct > 10}
        />
      </div>

      {/* Gráfico: receita mensal */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Receita mensal (recebimentos)</CardTitle>
        </CardHeader>
        <CardContent>
          {data.monthlyRevenue.length === 0 ? (
            <Empty message="Nenhum recebimento no período" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={data.monthlyRevenue}
                margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
              >
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  width={56}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                  }
                />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  formatter={(v: unknown) => [formatCurrency(Number(v)), "Receita"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Tabela de inadimplência */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Títulos Vencidos</CardTitle>
            <CsvExportButton
              data={overdueCsvData}
              filename="inadimplencia.csv"
              columns={[
                { key: "customer", label: "Cliente" },
                { key: "amount", label: "Valor" },
                { key: "dueDate", label: "Vencimento" },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent>
          {data.overdue.items.length === 0 ? (
            <Empty message="Nenhum título vencido" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-xs text-muted-foreground font-medium">
                      Cliente
                    </th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium">
                      Valor
                    </th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium">
                      Vencimento
                    </th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium">
                      Atraso
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.overdue.items.map((r, i) => {
                    const daysLate = Math.floor(
                      (Date.now() - new Date(r.dueDate).getTime()) / (1000 * 60 * 60 * 24)
                    )
                    return (
                      <tr
                        key={i}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-2.5 font-medium">{r.customer}</td>
                        <td className="py-2.5 text-right text-red-600 dark:text-red-400 font-medium tabular-nums">
                          {formatCurrency(r.amount)}
                        </td>
                        <td className="py-2.5 text-right text-muted-foreground tabular-nums">
                          {new Date(r.dueDate).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-2.5 text-right tabular-nums">
                          <span className="text-red-600 dark:text-red-400">
                            {daysLate}d
                          </span>
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
    </div>
  )
}
