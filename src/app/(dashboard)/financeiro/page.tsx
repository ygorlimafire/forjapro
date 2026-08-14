import { Suspense } from "react"
import { getReceivables, getPayables, getCashFlowSummary, getCashFlowTransactions, getDRE, getExpenseCategories, getFinancialDashboard } from "@/actions/financial"
import { getBankAccountsWithBalance, getBankAccounts } from "@/actions/bank-accounts"
import { getSuppliersList } from "@/actions/suppliers"
import { ReceivablesList } from "@/components/financial/receivables-list"
import { PayablesList } from "@/components/financial/payables-list"
import { CashFlowChart } from "@/components/financial/cash-flow-chart"
import { CashFlowTransactions } from "@/components/financial/cash-flow-transactions"
import { BankAccountsPanel } from "@/components/financial/bank-accounts-panel"
import { DREPanel } from "@/components/financial/dre-panel"
import { DREDateFilter } from "@/components/financial/dre-date-filter"
import { FinancialDashboardPanel } from "@/components/financial/financial-dashboard-panel"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { ReceivableStatus, PayableStatus } from "@prisma/client"
import { TrendingUp, TrendingDown, AlertTriangle, Clock } from "lucide-react"

type Tab = "visao-geral" | "receber" | "pagar" | "fluxo" | "contas" | "dre"

interface SearchParams {
  tab?: string
  status?: string
  from?: string
  to?: string
}

const TABS: { id: Tab; label: string }[] = [
  { id: "visao-geral", label: "Visão Geral" },
  { id: "receber", label: "Contas a Receber" },
  { id: "pagar", label: "Contas a Pagar" },
  { id: "fluxo", label: "Fluxo de Caixa" },
  { id: "contas", label: "Contas Bancárias" },
  { id: "dre", label: "DRE" },
]

function TabLink({ tab, current, children }: { tab: Tab; current: Tab; children: React.ReactNode }) {
  return (
    <Link
      href={`?tab=${tab}`}
      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
      className={cn(
        "px-4 py-2.5 font-bold text-[13px] uppercase tracking-[0.02em] border-b-2 -mb-px transition-colors whitespace-nowrap",
        current === tab
          ? "border-[#b5652f] text-[#16181c]"
          : "border-transparent text-[#9ba1a8] hover:text-[#16181c]"
      )}
    >
      {children}
    </Link>
  )
}

const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }

function SummaryCard({ label, value, sub, variant, icon }: {
  label: string; value: number; sub?: string; variant?: "green" | "red" | "blue" | "yellow"; icon?: React.ReactNode
}) {
  const color = { green: "#3f7d4e", red: "#b23b32", blue: "#2b5fa3", yellow: "#8a6d00" }[variant ?? "blue"]
  return (
    <div className="bg-white border border-[#dde0e3] p-4">
      <div style={{ ...mono, fontSize: "10px", color: "#9ba1a8", letterSpacing: "0.04em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "4px" }}>{icon}{label}</div>
      <p style={{ ...mono, fontWeight: 600, fontSize: "18px", color, marginTop: "6px", lineHeight: 1.1 }}>{formatCurrency(value)}</p>
      {sub && <p style={{ ...mono, fontSize: "10px", color: "#9ba1a8", marginTop: "4px" }}>{sub}</p>}
    </div>
  )
}

function StatusFilter({ tab, current }: { tab: "receber" | "pagar"; current: string | undefined }) {
  const options = tab === "receber"
    ? [["", "Todos"], ["PENDENTE", "A receber"], ["VENCIDO", "Vencidos"], ["PAGO", "Recebidos"], ["CANCELADO", "Cancelados"]]
    : [["", "Todos"], ["PENDENTE", "A pagar"], ["VENCIDO", "Vencidos"], ["PAGO", "Pagos"], ["CANCELADO", "Cancelados"]]

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(([s, label]) => (
        <Link
          key={s}
          href={s ? `?tab=${tab}&status=${s}` : `?tab=${tab}`}
          className={cn(
            "inline-flex items-center px-3.5 py-1.5 text-[12px] font-semibold transition-colors",
            (current ?? "") === s
              ? "bg-[#16181c] text-white"
              : "border border-[#dde0e3] text-[#6b7178] hover:border-[#b5652f] hover:text-[#16181c]"
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  )
}

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const tab = (params.tab ?? "visao-geral") as Tab
  const from = params.from
  const to = params.to

  const [recData, payData, summary, transactions, dreData, bankAccountsWithBalance, bankAccounts, expenseCategories, payableSuppliers, dashboardData] = await Promise.all([
    tab === "receber"
      ? getReceivables({ status: params.status as ReceivableStatus | "VENCIDO" | undefined, from, to })
      : Promise.resolve(null),
    tab === "pagar"
      ? getPayables({ status: params.status as PayableStatus | "VENCIDO" | undefined, from, to })
      : Promise.resolve(null),
    tab === "fluxo" ? getCashFlowSummary() : Promise.resolve(null),
    tab === "fluxo" ? getCashFlowTransactions({ from, to }) : Promise.resolve(null),
    tab === "dre" ? getDRE({ from, to }) : Promise.resolve(null),
    tab === "contas" ? getBankAccountsWithBalance() : Promise.resolve(null),
    (tab === "receber" || tab === "pagar") ? getBankAccounts() : Promise.resolve([]),
    tab === "pagar" ? getExpenseCategories() : Promise.resolve([]),
    tab === "pagar" ? getSuppliersList({ isActive: true }) : Promise.resolve([]),
    tab === "visao-geral" ? getFinancialDashboard() : Promise.resolve(null),
  ])

  return (
    <div className="p-6 bg-background min-h-full">
      {/* ── Header ── */}
      <div className="mb-6">
        <p style={{ ...mono, fontSize: "11px", color: "#9ba1a8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          FINANÇAS
        </p>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "34px", color: "#16181c", lineHeight: 1, marginTop: "2px" }}>
          Financeiro
        </h1>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-[#dde0e3] overflow-x-auto mb-6">
        {TABS.map(({ id, label }) => (
          <TabLink key={id} tab={id} current={tab}>{label}</TabLink>
        ))}
      </div>

      {/* ── Visão Geral ── */}
      {tab === "visao-geral" && dashboardData !== null && (
        <FinancialDashboardPanel data={dashboardData} />
      )}

      {/* ── Contas a Receber ── */}
      {tab === "receber" && recData !== null && (
        <div className="space-y-3">
          <StatusFilter tab="receber" current={params.status} />
          <Suspense>
            <ReceivablesList receivables={recData} bankAccounts={bankAccounts ?? []} />
          </Suspense>
        </div>
      )}

      {/* ── Contas a Pagar ── */}
      {tab === "pagar" && payData !== null && (
        <div className="space-y-3">
          <StatusFilter tab="pagar" current={params.status} />
          <Suspense>
            <PayablesList payables={payData} bankAccounts={bankAccounts ?? []} expenseCategories={expenseCategories ?? []} suppliers={payableSuppliers ?? []} />
          </Suspense>
        </div>
      )}

      {/* ── Fluxo de Caixa ── */}
      {tab === "fluxo" && summary !== null && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: "2px" }}>
            <SummaryCard label="Saldo realizado" value={summary.realizedBalance} sub={`Entradas: ${formatCurrency(summary.realizedIn)}`} variant={summary.realizedBalance >= 0 ? "green" : "red"} icon={summary.realizedBalance >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} />
            <SummaryCard label="Saldo previsto" value={summary.forecastBalance} sub={`Pendentes: ${formatCurrency(summary.forecastIn)} / ${formatCurrency(summary.forecastOut)}`} variant={summary.forecastBalance >= 0 ? "blue" : "yellow"} icon={<Clock size={12} />} />
            <SummaryCard label="Recebíveis vencidos" value={summary.overdueIn} variant="red" icon={<AlertTriangle size={12} />} />
            <SummaryCard label="Pagamentos vencidos" value={summary.overdueOut} variant="red" icon={<AlertTriangle size={12} />} />
          </div>
          <div className="grid grid-cols-2 gap-px">
            <div className="bg-white border border-[#dde0e3] p-4">
              <p style={{ ...mono, fontSize: "10px", color: "#9ba1a8", textTransform: "uppercase", letterSpacing: "0.04em" }}>A receber — próximos 7 dias</p>
              <p style={{ ...mono, fontWeight: 600, fontSize: "18px", color: "#3f7d4e", marginTop: "6px" }}>{formatCurrency(summary.due7In)}</p>
              <p style={{ ...mono, fontSize: "10px", color: "#9ba1a8", marginTop: "4px" }}>30 dias: {formatCurrency(summary.due30In)}</p>
            </div>
            <div className="bg-white border border-[#dde0e3] p-4">
              <p style={{ ...mono, fontSize: "10px", color: "#9ba1a8", textTransform: "uppercase", letterSpacing: "0.04em" }}>A pagar — próximos 7 dias</p>
              <p style={{ ...mono, fontWeight: 600, fontSize: "18px", color: "#b23b32", marginTop: "6px" }}>{formatCurrency(summary.due7Out)}</p>
              <p style={{ ...mono, fontSize: "10px", color: "#9ba1a8", marginTop: "4px" }}>30 dias: {formatCurrency(summary.due30Out)}</p>
            </div>
          </div>
          <div className="bg-white border border-[#dde0e3] p-4">
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "13px", color: "#16181c", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "16px" }}>
              Entradas e saídas mensais
            </p>
            <CashFlowChart data={summary.monthlySeries} />
          </div>
          {transactions !== null && (
            <div className="bg-white border border-[#dde0e3] p-4">
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "13px", color: "#16181c", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "16px" }}>
                Movimentações realizadas
              </p>
              <CashFlowTransactions transactions={transactions} />
            </div>
          )}
        </div>
      )}

      {/* ── Contas Bancárias ── */}
      {tab === "contas" && bankAccountsWithBalance !== null && (
        <BankAccountsPanel accounts={bankAccountsWithBalance} />
      )}

      {/* ── DRE ── */}
      {tab === "dre" && dreData !== null && (
        <div className="space-y-4">
          <Suspense>
            <DREDateFilter from={from} to={to} />
          </Suspense>
          <DREPanel data={dreData} />
        </div>
      )}
    </div>
  )
}
