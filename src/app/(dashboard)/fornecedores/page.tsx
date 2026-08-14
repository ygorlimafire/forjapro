import { getSuppliersList } from "@/actions/suppliers"
import Link from "next/link"
import { StatusBadge } from "@/components/ui/status-badge"
import { Package } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SupplierType } from "@prisma/client"

const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }

const TYPE_LABELS: Record<SupplierType, string> = {
  PRODUTO: "Produto",
  SERVICO: "Serviço",
  DESPESA_FIXA: "Despesa Fixa",
  OUTRO: "Outro",
}

interface SearchParams {
  tipo?: string
  inativo?: string
}

export default async function FornecedoresPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const typeFilter = params.tipo as SupplierType | undefined
  const showInactive = params.inativo === "1"

  const suppliers = await getSuppliersList({
    type: typeFilter,
    ...(showInactive ? {} : { isActive: true }),
  })

  const types: { value: string; label: string }[] = [
    { value: "", label: "Todos" },
    { value: "PRODUTO", label: "Produtos" },
    { value: "SERVICO", label: "Serviços" },
    { value: "DESPESA_FIXA", label: "Despesa Fixa" },
    { value: "OUTRO", label: "Outros" },
  ]

  function filterHref(tipo: string) {
    const p = new URLSearchParams()
    if (tipo) p.set("tipo", tipo)
    if (showInactive) p.set("inativo", "1")
    const qs = p.toString()
    return qs ? `?${qs}` : "/fornecedores"
  }

  return (
    <div className="p-6 bg-background min-h-full">
      {/* ── Header ── */}
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <p style={{ ...mono, fontSize: "11px", color: "#9ba1a8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            COMPRAS
          </p>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "34px", color: "#16181c", lineHeight: 1, marginTop: "2px" }}>
            Fornecedores
          </h1>
        </div>
        <Link
          href="/fornecedores/novo"
          className="btn-clip text-white inline-flex items-center px-5 py-2.5 font-display font-bold text-[14px] uppercase tracking-[0.02em]"
        >
          Novo Fornecedor
        </Link>
      </div>

      {/* ── Type chips ── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {types.map((t) => (
          <Link key={t.value} href={filterHref(t.value)}>
            <span className={cn(
              "inline-flex items-center px-3.5 py-1.5 text-[12px] font-semibold transition-colors",
              (typeFilter ?? "") === t.value
                ? "bg-[#16181c] text-white"
                : "border border-[#dde0e3] text-[#6b7178] hover:border-[#b5652f] hover:text-[#16181c]"
            )}>
              {t.label}
            </span>
          </Link>
        ))}
        <Link
          href={showInactive
            ? filterHref(typeFilter ?? "")
            : (typeFilter ? `?tipo=${typeFilter}&inativo=1` : "?inativo=1")}
          className="ml-auto text-[12px] font-semibold text-[#6b7178] hover:text-[#16181c] transition-colors"
        >
          {showInactive ? "Ocultar inativos" : "Mostrar inativos"}
        </Link>
      </div>

      {/* ── Table container ── */}
      <div className="bg-white border border-[#dde0e3]">
        {/* Desktop header */}
        <div
          className="hidden sm:grid px-4 py-2.5 bg-[#f5f6f7]"
          style={{ ...mono, fontSize: "11px", color: "#9ba1a8", gridTemplateColumns: "2fr 1fr 1.2fr 1fr 0.7fr" }}
        >
          <div>NOME</div>
          <div>TIPO</div>
          <div>CNPJ / CPF</div>
          <div>CONTATO</div>
          <div>STATUS</div>
        </div>

        {/* Rows */}
        {suppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2">
            <Package size={32} className="text-[#dde0e3]" />
            <p className="text-[13px] text-[#9ba1a8]">Nenhum fornecedor encontrado</p>
          </div>
        ) : (
          suppliers.map((s) => {
            const name = s.tradeName || s.companyName
            const status = s.isActive ? "ATIVO" : "INATIVO"
            const contact = s.phone || s.email || "—"

            return (
              <div key={s.id} className="border-t border-[#eceef0] group">
                {/* Desktop row */}
                <Link
                  href={`/fornecedores/${s.id}`}
                  className="hidden sm:grid items-center px-4 py-3.5 text-[14px] hover:bg-[#f5f6f7] transition-colors"
                  style={{ gridTemplateColumns: "2fr 1fr 1.2fr 1fr 0.7fr" }}
                >
                  <div className="font-semibold text-[#16181c] truncate pr-3 group-hover:text-[#b5652f]">
                    {name}
                    {s.tradeName && s.companyName && s.tradeName !== s.companyName && (
                      <span className="block text-[12px] font-normal text-[#6b7178]">{s.companyName}</span>
                    )}
                  </div>
                  <div className="text-[#6b7178] text-[13px]">{TYPE_LABELS[s.type]}</div>
                  <div style={mono} className="text-[#6b7178] text-[13px]">{s.document || "—"}</div>
                  <div style={mono} className="text-[#6b7178] text-[13px] truncate pr-3">{contact}</div>
                  <div><StatusBadge status={status} /></div>
                </Link>

                {/* Mobile row */}
                <Link href={`/fornecedores/${s.id}`} className="sm:hidden block px-4 py-3.5 hover:bg-[#f5f6f7] transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-[14px] text-[#16181c] truncate">{name}</span>
                    <StatusBadge status={status} />
                  </div>
                  <p className="text-[12px] text-[#6b7178]">
                    {TYPE_LABELS[s.type]}{contact !== "—" ? ` · ${contact}` : ""}
                  </p>
                </Link>
              </div>
            )
          })
        )}
      </div>

      {suppliers.length > 0 && (
        <p style={mono} className="mt-3 text-[11px] text-[#9ba1a8]">
          {suppliers.length} {suppliers.length === 1 ? "fornecedor" : "fornecedores"}
        </p>
      )}
    </div>
  )
}
