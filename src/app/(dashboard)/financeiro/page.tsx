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
      className={cn(
        "px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
        current === tab
          ? "bg-background shadow-sm text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </Link>
  )
}

function SummaryCard({ label, value, sub, variant, icon }: {
  label: string; value: number; sub?: string; variant?: "green" | "red" | "blue" | "yellow"; icon?: React.ReactNode
}) {
  const color = { green: "text-green-600 dark:text-green-400", red: "text-red-600 dark:text-red-400", blue: "text-blue-600 dark:text-blue-400", yellow: "text-yellow-600 dark:text-yellow-400" }[variant ?? "blue"]
  return (
    <div className="rounded-xl border bg-card p-4 space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</div>
      <p className={cn("text-lg font-bold", color)}>{formatCurrency(value)}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
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
            "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
            (current ?? "") === s
              ? "bg-foreground text-background border-foreground"
              : "bg-background text-muted-foreground border-input hover:text-foreground"
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Financeiro</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl overflow-x-auto">
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
        <div className="space-y-4">
          <StatusFilter tab="receber" current={params.status} />
          <Suspense>
            <ReceivablesList receivables={recData} bankAccounts={bankAccounts ?? []} />
          </Suspense>
        </div>
      )}

      {/* ── Contas a Pagar ── */}
      {tab === "pagar" && payData !== null && (
        <div className="space-y-4">
          <StatusFilter tab="pagar" current={params.status} />
          <Suspense>
            <PayablesList payables={payData} bankAccounts={bankAccounts ?? []} expenseCategories={expenseCategories ?? []} suppliers={payableSuppliers ?? []} />
          </Suspense>
        </div>
      )}

      {/* ── Fluxo de Caixa ── */}
      {tab === "fluxo" && summary !== null && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard label="Saldo realizado" value={summary.realizedBalance} sub={`Entradas: ${formatCurrency(summary.realizedIn)}`} variant={summary.realizedBalance >= 0 ? "green" : "red"} icon={summary.realizedBalance >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} />
            <SummaryCard label="Saldo previsto" value={summary.forecastBalance} sub={`Pendentes: ${formatCurrency(summary.forecastIn)} / ${formatCurrency(summary.forecastOut)}`} variant={summary.forecastBalance >= 0 ? "blue" : "yellow"} icon={<Clock size={12} />} />
            <SummaryCard label="Recebíveis vencidos" value={summary.overdueIn} variant="red" icon={<AlertTriangle size={12} />} />
            <SummaryCard label="Pagamentos vencidos" value={summary.overdueOut} variant="red" icon={<AlertTriangle size={12} />} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-2">A receber — próximos 7 dias</p>
              <p className="text-base font-bold text-green-600 dark:text-green-400">{formatCurrency(summary.due7In)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">30 dias: {formatCurrency(summary.due30In)}</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-2">A pagar — próximos 7 dias</p>
              <p className="text-base font-bold text-red-600 dark:text-red-400">{formatCurrency(summary.due7Out)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">30 dias: {formatCurrency(summary.due30Out)}</p>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <h2 className="text-sm font-semibold mb-4">Entradas e saídas mensais</h2>
            <CashFlowChart data={summary.monthlySeries} />
          </div>
          {transactions !== null && (
            <div className="rounded-xl border bg-card p-4">
              <h2 className="text-sm font-semibold mb-4">Movimentações realizadas</h2>
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
