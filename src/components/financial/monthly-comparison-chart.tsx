"use client"

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { formatCurrency } from "@/lib/utils"

interface Props {
  data: { month: string; revenue: number; expenses: number; result: number }[]
}

function formatShort(v: number) {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}k`
  return String(Math.round(v))
}

export function MonthlyComparisonChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
        <YAxis tickFormatter={formatShort} tick={{ fontSize: 10 }} width={36} />
        <Tooltip
          formatter={(v, name) => [
            formatCurrency(Number(v)),
            name === "revenue" ? "Receitas" : name === "expenses" ? "Despesas" : "Resultado",
          ]}
          contentStyle={{ fontSize: 11, borderRadius: 8 }}
        />
        <Legend
          iconType="square"
          iconSize={8}
          wrapperStyle={{ fontSize: 11 }}
          formatter={(v) => v === "revenue" ? "Receitas" : v === "expenses" ? "Despesas" : "Resultado"}
        />
        <Bar dataKey="revenue" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={28} />
        <Bar dataKey="expenses" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={28} />
        <Line type="monotone" dataKey="result" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
