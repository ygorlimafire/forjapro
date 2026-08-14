"use client"

import type { getComercialReport } from "@/actions/reports"
import type { LucideIcon } from "lucide-react"
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
import {
  TrendingUp,
  FileCheck,
  Clock,
  DollarSign,
  AlertCircle,
  FileX,
} from "lucide-react"

type ComercialData = Awaited<ReturnType<typeof getComercialReport>>

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  RASCUNHO:      { label: "Rascunho",       color: "#9ca3af" },
  ENVIADA:       { label: "Enviada",         color: "#3b82f6" },
  EM_NEGOCIACAO: { label: "Em negociação",   color: "#f59e0b" },
  APROVADA:      { label: "Aprovada",        color: "#22c55e" },
  RECUSADA:      { label: "Recusada",        color: "#ef4444" },
  VENCIDA:       { label: "Vencida",         color: "#6b7280" },
  CANCELADA:     { label: "Cancelada",       color: "#6b7280" },
}

function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  title: string
  value: string
  sub?: string
  icon: LucideIcon
  accent?: boolean
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <Icon size={14} className={accent ? "text-green-500" : "text-muted-foreground"} />
        </div>
        <p className={`text-2xl font-bold ${accent ? "text-green-600 dark:text-green-400" : ""}`}>
          {value}
        </p>
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

export function ComercialSection({ data }: { data: ComercialData }) {
  const chartData = data.byStatus.map((s) => ({
    ...s,
    label: STATUS_CONFIG[s.status]?.label ?? s.status,
    fill: STATUS_CONFIG[s.status]?.color ?? "#9ca3af",
  }))

  const sellerCsvData = data.bySeller.map((s) => ({
    name: s.name,
    total: s.total,
    aprovadas: s.aprovadas,
    conversionRate: `${s.conversionRate.toFixed(1)}%`,
    valor: formatCurrency(s.valor),
  }))

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Total no período"
          value={String(data.totalInPeriod)}
          sub="propostas emitidas"
          icon={FileCheck}
        />
        <KpiCard
          title="Taxa de conversão"
          value={`${data.conversionRate.toFixed(1)}%`}
          sub={`${data.approvedCount} de ${data.totalInPeriod} aprovadas`}
          icon={TrendingUp}
          accent={data.conversionRate >= 30}
        />
        <KpiCard
          title="Ticket médio"
          value={formatCurrency(data.ticketMedio)}
          sub="por proposta aprovada"
          icon={DollarSign}
        />
        <KpiCard
          title="Valor vendido"
          value={formatCurrency(data.approvedValue)}
          sub="propostas aprovadas"
          icon={DollarSign}
          accent
        />
        <KpiCard
          title="Em negociação"
          value={formatCurrency(data.inNegotiation.value)}
          sub={`${data.inNegotiation.count} propostas abertas`}
          icon={AlertCircle}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart: por status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Propostas por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <Empty message="Nenhuma proposta no período" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={28} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    formatter={(v: unknown) => [`${v} proposta${Number(v) !== 1 ? "s" : ""}`, "Qtd"]}
                  />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={40}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Tempo médio de aprovação */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Tempo médio de aprovação</CardTitle>
              <Clock size={14} className="text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {data.avgApprovalDays > 0 ? (
              <>
                <p className="text-5xl font-bold mt-4">
                  {data.avgApprovalDays.toFixed(1)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">dias da emissão à aprovação</p>
                <p className="text-xs text-muted-foreground mt-4">
                  Baseado em {data.approvedCount} propost{data.approvedCount !== 1 ? "as" : "a"} aprovada{data.approvedCount !== 1 ? "s" : ""} no período
                </p>
              </>
            ) : (
              <Empty message="Nenhuma proposta aprovada no período" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Por vendedor */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Por Vendedor</CardTitle>
            <CsvExportButton
              data={sellerCsvData}
              filename="relatorio-vendedores.csv"
              columns={[
                { key: "name", label: "Vendedor" },
                { key: "total", label: "Total propostas" },
                { key: "aprovadas", label: "Aprovadas" },
                { key: "conversionRate", label: "Conversão" },
                { key: "valor", label: "Valor aprovado" },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent>
          {data.bySeller.length === 0 ? (
            <Empty message="Nenhum dado de vendedor disponível" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-xs text-muted-foreground font-medium">Vendedor</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium">Total</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium">Aprovadas</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium">Conversão</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium">Valor aprovado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bySeller.map((s, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 font-medium">{s.name}</td>
                      <td className="py-2.5 text-right text-muted-foreground">{s.total}</td>
                      <td className="py-2.5 text-right">{s.aprovadas}</td>
                      <td className="py-2.5 text-right">
                        <span className={s.conversionRate >= 30 ? "text-green-600 dark:text-green-400 font-medium" : ""}>
                          {s.conversionRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-medium">{formatCurrency(s.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Motivos de recusa */}
      {data.rejectionReasons.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileX size={14} className="text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Motivos de Recusa</CardTitle>
              </div>
              <CsvExportButton
                data={data.rejectionReasons}
                filename="motivos-recusa.csv"
                columns={[
                  { key: "reason", label: "Motivo" },
                  { key: "count", label: "Qtd" },
                ]}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.rejectionReasons.map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-4 text-sm py-1 border-b last:border-0">
                  <span className="text-muted-foreground flex-1 truncate">{r.reason}</span>
                  <span className="font-medium shrink-0 tabular-nums">{r.count}×</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
