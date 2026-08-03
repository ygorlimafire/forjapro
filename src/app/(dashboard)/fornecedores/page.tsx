import { getSuppliersList } from "@/actions/suppliers"
import Link from "next/link"
import { Plus, Pencil, Globe, Package, Wrench, Receipt, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SupplierType } from "@prisma/client"

const TYPE_CONFIG: Record<SupplierType, { label: string; icon: React.ReactNode; className: string }> = {
  PRODUTO: { label: "Produto", icon: <Package size={11} />, className: "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/30 dark:border-blue-900/50" },
  SERVICO: { label: "Serviço", icon: <Wrench size={11} />, className: "text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950/30 dark:border-purple-900/50" },
  DESPESA_FIXA: { label: "Despesa Fixa", icon: <Receipt size={11} />, className: "text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950/30 dark:border-orange-900/50" },
  OUTRO: { label: "Outro", icon: <HelpCircle size={11} />, className: "text-muted-foreground bg-muted border-border" },
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fornecedores</h1>
        <Link
          href="/fornecedores/novo"
          className="flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={15} />
          Novo fornecedor
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5">
          {types.map((t) => (
            <Link
              key={t.value}
              href={filterHref(t.value)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                (typeFilter ?? "") === t.value
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-muted-foreground border-input hover:text-foreground"
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <Link
          href={showInactive ? filterHref(typeFilter ?? "") : (typeFilter ? `?tipo=${typeFilter}&inativo=1` : "?inativo=1")}
          className={cn(
            "ml-auto text-xs underline",
            showInactive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {showInactive ? "Ocultar inativos" : "Mostrar inativos"}
        </Link>
      </div>

      {/* List */}
      {suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package size={40} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum fornecedor encontrado</p>
          <Link href="/fornecedores/novo" className="mt-2 text-sm text-primary hover:underline">
            Cadastrar primeiro fornecedor
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {suppliers.map((s) => {
            const config = TYPE_CONFIG[s.type]
            const displayName = s.tradeName || s.companyName
            const isIntl = s.country !== "BR"

            return (
              <div
                key={s.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border bg-card",
                  !s.isActive && "opacity-50"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
                      {config.icon}
                      {config.label}
                    </span>
                    {isIntl && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border text-muted-foreground bg-muted border-border">
                        <Globe size={10} />
                        {s.country} · {s.currency}
                      </span>
                    )}
                    {!s.isActive && (
                      <span className="text-xs text-muted-foreground">(Inativo)</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold">{displayName}</p>
                  {s.tradeName && s.tradeName !== s.companyName && (
                    <p className="text-xs text-muted-foreground">{s.companyName}</p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                    {s.document && <span>{s.document}</span>}
                    {s.phone && <span>{s.phone}</span>}
                    {s.email && <span>{s.email}</span>}
                    {s.city && <span>{s.city}{s.state ? `, ${s.state}` : ""}</span>}
                  </div>
                </div>
                <Link
                  href={`/fornecedores/${s.id}`}
                  className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Pencil size={13} />
                  Editar
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
