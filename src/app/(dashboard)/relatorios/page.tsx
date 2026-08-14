import { Metadata } from "next"
import { DateFilter } from "@/components/relatorios/date-filter"
import { TabNav } from "@/components/relatorios/tab-nav"
import { ComercialSection } from "@/components/relatorios/comercial-section"
import { FinanceiroSection } from "@/components/relatorios/financeiro-section"
import { EstoqueSection } from "@/components/relatorios/estoque-section"
import { MargemSection } from "@/components/relatorios/margem-section"
import { FunilSection } from "@/components/relatorios/funil-section"
import {
  getComercialReport,
  getFinancialReport,
  getStockReport,
  getMarginReport,
  getCRMReport,
} from "@/actions/reports"
import { getStockList } from "@/actions/stock"

export const metadata: Metadata = { title: "Relatórios" }

type SearchParams = Promise<{ tab?: string; from?: string; to?: string }>

function toLocalYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { tab = "comercial", from, to } = await searchParams

  const now = new Date()
  const defaultFrom = toLocalYMD(new Date(now.getFullYear(), now.getMonth(), 1))
  const defaultTo = toLocalYMD(new Date(now.getFullYear(), now.getMonth() + 1, 0))

  const fromStr = from ?? defaultFrom
  const toStr = to ?? defaultTo
  const dateFrom = new Date(fromStr + "T00:00:00")
  const dateTo = new Date(toStr + "T23:59:59")

  const [comercialData, financeiroData, estoqueData, snapshotData, margemData, funilData] = await Promise.all([
    tab === "comercial" ? getComercialReport(dateFrom, dateTo) : Promise.resolve(null),
    tab === "financeiro" ? getFinancialReport(dateFrom, dateTo) : Promise.resolve(null),
    tab === "estoque" ? getStockReport(dateFrom, dateTo) : Promise.resolve(null),
    tab === "estoque" ? getStockList() : Promise.resolve(null),
    tab === "margem" ? getMarginReport(dateFrom, dateTo) : Promise.resolve(null),
    tab === "funil" ? getCRMReport(dateFrom, dateTo) : Promise.resolve(null),
  ])

  const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }

  return (
    <div className="p-6 bg-background min-h-full space-y-6">
      {/* ── Header ── */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p style={{ ...mono, fontSize: "11px", color: "#9ba1a8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            ANÁLISE
          </p>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "34px", color: "#16181c", lineHeight: 1, marginTop: "2px" }}>
            Relatórios
          </h1>
        </div>
        <DateFilter currentFrom={fromStr} currentTo={toStr} currentTab={tab} />
      </div>

      <TabNav currentTab={tab} currentFrom={fromStr} currentTo={toStr} />

      {tab === "comercial" && comercialData && (
        <ComercialSection data={comercialData} />
      )}
      {tab === "financeiro" && financeiroData && (
        <FinanceiroSection data={financeiroData} />
      )}
      {tab === "estoque" && estoqueData && snapshotData && (
        <EstoqueSection data={estoqueData} snapshot={snapshotData} />
      )}
      {tab === "margem" && margemData && (
        <MargemSection data={margemData} />
      )}
      {tab === "funil" && funilData && (
        <FunilSection data={funilData} />
      )}
    </div>
  )
}
