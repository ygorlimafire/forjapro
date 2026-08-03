import { formatCurrency } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

type DREData = {
  grossRevenue: number
  cogsValue: number
  grossMargin: number
  grossMarginPct: number
  expensesByCategory: Record<string, number>
  totalExpenses: number
  netResult: number
  netResultPct: number
}

interface Props {
  data: DREData
}

function DRERow({ label, value, pct, bold, indent, variant }: {
  label: string
  value: number
  pct?: number
  bold?: boolean
  indent?: boolean
  variant?: "positive" | "negative" | "neutral"
}) {
  const color = variant === "positive"
    ? "text-green-600 dark:text-green-400"
    : variant === "negative"
    ? "text-red-600 dark:text-red-400"
    : ""

  return (
    <div className={`flex items-center justify-between py-2 ${bold ? "border-t border-b font-semibold" : "border-b"}`}>
      <span className={`text-sm ${indent ? "pl-4 text-muted-foreground" : ""} ${bold ? "" : ""}`}>{label}</span>
      <div className="flex items-center gap-4">
        {pct !== undefined && (
          <span className="text-xs text-muted-foreground w-12 text-right">{pct.toFixed(1)}%</span>
        )}
        <span className={`text-sm font-medium ${color} w-28 text-right`}>{formatCurrency(value)}</span>
      </div>
    </div>
  )
}

function SectionHeader({ label }: { label: string }) {
  return <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-4 pb-1">{label}</p>
}

export function DREPanel({ data }: Props) {
  const hasData = data.grossRevenue > 0 || data.totalExpenses > 0

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Minus size={32} className="text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">Sem dados de resultado no período selecionado</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-1">
      <SectionHeader label="Receitas" />
      <DRERow label="Receita bruta (vendas recebidas)" value={data.grossRevenue} pct={100} variant="positive" />

      <SectionHeader label="Custo das mercadorias vendidas" />
      <DRERow label="CMV (custo de compra dos produtos)" value={data.cogsValue} indent pct={data.grossRevenue > 0 ? (data.cogsValue / data.grossRevenue) * 100 : 0} variant="negative" />
      <DRERow label="Margem bruta" value={data.grossMargin} pct={data.grossMarginPct} bold variant={data.grossMargin >= 0 ? "positive" : "negative"} />

      {Object.keys(data.expensesByCategory).length > 0 && (
        <>
          <SectionHeader label="Despesas" />
          {Object.entries(data.expensesByCategory).sort(([, a], [, b]) => b - a).map(([cat, val]) => (
            <DRERow
              key={cat}
              label={cat}
              value={val}
              indent
              pct={data.grossRevenue > 0 ? (val / data.grossRevenue) * 100 : 0}
              variant="negative"
            />
          ))}
          <DRERow label="Total de despesas" value={data.totalExpenses} pct={data.grossRevenue > 0 ? (data.totalExpenses / data.grossRevenue) * 100 : 0} bold variant="negative" />
        </>
      )}

      <div className="pt-2">
        <div className={`flex items-center justify-between py-3 px-4 rounded-xl border-2 ${data.netResult >= 0 ? "border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/20" : "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20"}`}>
          <div className="flex items-center gap-2">
            {data.netResult >= 0 ? <TrendingUp size={16} className="text-green-600" /> : <TrendingDown size={16} className="text-red-600" />}
            <span className="font-semibold text-sm">Resultado líquido</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">{data.netResultPct.toFixed(1)}%</span>
            <span className={`font-bold text-base ${data.netResult >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {formatCurrency(data.netResult)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
