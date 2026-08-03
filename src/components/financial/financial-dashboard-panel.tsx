import { ExpensePieChart } from "./expense-pie-chart"
import { MonthlyComparisonChart } from "./monthly-comparison-chart"
import { formatCurrency, formatDate } from "@/lib/utils"
import { AlertTriangle, Clock } from "lucide-react"

interface Props {
  data: {
    monthlyComparison: { month: string; revenue: number; expenses: number; result: number }[]
    expensesByCategory: { name: string; color: string; total: number }[]
    urgentPayables: { id: string; amount: number; dueDate: Date; label: string; isOverdue: boolean }[]
    top5Expenses: { name: string; color: string; total: number }[]
  }
}

export function FinancialDashboardPanel({ data }: Props) {
  const totalExpenses = data.top5Expenses.reduce((s, e) => s + e.total, 0)
  const currentMonth = data.monthlyComparison[data.monthlyComparison.length - 1]
  const prevMonth = data.monthlyComparison[data.monthlyComparison.length - 2]

  function pctChange(curr: number, prev: number) {
    if (prev === 0) return null
    return ((curr - prev) / prev) * 100
  }

  const revChange = pctChange(currentMonth?.revenue ?? 0, prevMonth?.revenue ?? 0)
  const expChange = pctChange(currentMonth?.expenses ?? 0, prevMonth?.expenses ?? 0)

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          label="Receitas (mês atual)"
          value={currentMonth?.revenue ?? 0}
          change={revChange}
          positive
        />
        <KpiCard
          label="Despesas (mês atual)"
          value={currentMonth?.expenses ?? 0}
          change={expChange}
          positive={false}
        />
        <KpiCard
          label="Resultado (mês atual)"
          value={currentMonth?.result ?? 0}
          colored
        />
        <div className="rounded-xl border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Contas urgentes</p>
          <p className="text-lg font-bold text-foreground">{data.urgentPayables.length}</p>
          <p className="text-xs text-muted-foreground">próximos 30 dias</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly comparison chart */}
        <div className="rounded-xl border bg-card p-4">
          <h2 className="text-sm font-semibold mb-4">Receitas vs Despesas (6 meses)</h2>
          <MonthlyComparisonChart data={data.monthlyComparison} />
        </div>

        {/* Expense pie chart */}
        <div className="rounded-xl border bg-card p-4">
          <h2 className="text-sm font-semibold mb-1">Despesas por categoria (mês atual)</h2>
          <ExpensePieChart data={data.expensesByCategory} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 expenses */}
        <div className="rounded-xl border bg-card p-4">
          <h2 className="text-sm font-semibold mb-4">Top 5 categorias (6 meses)</h2>
          {data.top5Expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Sem dados</p>
          ) : (
            <div className="space-y-3">
              {data.top5Expenses.map((e, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color }} />
                      <span className="font-medium">{e.name}</span>
                    </div>
                    <span className="text-muted-foreground">{formatCurrency(e.total)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: e.color,
                        width: `${totalExpenses > 0 ? (e.total / totalExpenses) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Urgent payables */}
        <div className="rounded-xl border bg-card p-4">
          <h2 className="text-sm font-semibold mb-4">Contas urgentes (próximos 30 dias)</h2>
          {data.urgentPayables.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma conta próxima do vencimento</p>
          ) : (
            <div className="space-y-2">
              {data.urgentPayables.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-1.5">
                  {p.isOverdue
                    ? <AlertTriangle size={14} className="text-red-500 shrink-0" />
                    : <Clock size={14} className="text-yellow-500 shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.label}</p>
                    <p className={`text-xs ${p.isOverdue ? "text-red-500" : "text-muted-foreground"}`}>
                      {p.isOverdue ? "Venceu em " : "Vence em "}{formatDate(p.dueDate)}
                    </p>
                  </div>
                  <p className="text-sm font-bold shrink-0">{formatCurrency(p.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, change, positive, colored }: {
  label: string
  value: number
  change?: number | null
  positive?: boolean
  colored?: boolean
}) {
  const isGood = colored ? value >= 0 : (positive ? (change ?? 0) >= 0 : (change ?? 0) <= 0)
  const color = colored
    ? (value >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")
    : "text-foreground"

  return (
    <div className="rounded-xl border bg-card p-4 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{formatCurrency(value)}</p>
      {change != null && (
        <p className={`text-xs ${isGood ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(1)}% vs mês anterior
        </p>
      )}
    </div>
  )
}
