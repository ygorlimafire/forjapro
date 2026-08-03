"use client"

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency } from "@/lib/utils"

type MonthEntry = {
  month: string
  entradas: number
  saidas: number
  saldo: number
}

interface Props {
  data: MonthEntry[]
}

function formatShort(value: number) {
  if (Math.abs(value) >= 1000) return `R$${(value / 1000).toFixed(1)}k`
  return `R$${value.toFixed(0)}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover p-3 shadow-md text-xs space-y-1">
      <p className="font-semibold mb-1.5">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium ml-auto pl-4">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function CashFlowChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={formatShort}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={56}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="square"
          iconSize={10}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Bar dataKey="entradas" name="Entradas" fill="hsl(142 76% 36%)" radius={[3, 3, 0, 0]} maxBarSize={40} />
        <Bar dataKey="saidas" name="Saídas" fill="hsl(0 84% 60%)" radius={[3, 3, 0, 0]} maxBarSize={40} />
        <Line
          type="monotone"
          dataKey="saldo"
          name="Saldo"
          stroke="hsl(221 83% 53%)"
          strokeWidth={2}
          dot={{ r: 3, fill: "hsl(221 83% 53%)" }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
