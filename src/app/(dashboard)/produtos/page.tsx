import { Metadata } from "next"
import Link from "next/link"
import { getProducts, getCategories } from "@/actions/products"
import { formatCurrency, calculateMargin } from "@/lib/utils"
import { StatusBadge } from "@/components/ui/status-badge"
import { ProductActions } from "@/components/products/product-actions"
import { Package } from "lucide-react"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Produtos" }

interface Props {
  searchParams: Promise<{ q?: string; category?: string }>
}

const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }

export default async function ProdutosPage({ searchParams }: Props) {
  const { q, category } = await searchParams
  const [products, categories] = await Promise.all([
    getProducts(q, category),
    getCategories(),
  ])

  return (
    <div className="p-6 bg-background min-h-full">
      {/* ── Header ── */}
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <p style={{ ...mono, fontSize: "11px", color: "#9ba1a8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            CATÁLOGO
          </p>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "34px", color: "#16181c", lineHeight: 1, marginTop: "2px" }}>
            Produtos
          </h1>
        </div>
        <Link
          href="/produtos/novo"
          className="btn-clip text-white inline-flex items-center px-5 py-2.5 font-display font-bold text-[14px] uppercase tracking-[0.02em]"
        >
          Novo Produto
        </Link>
      </div>

      {/* ── Category chips ── */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Link href={q ? `?q=${q}` : "/produtos"}>
          <span className={cn(
            "inline-flex items-center px-3.5 py-1.5 text-[12px] font-semibold transition-colors",
            !category
              ? "bg-[#16181c] text-white"
              : "border border-[#dde0e3] text-[#6b7178] hover:border-[#b5652f] hover:text-[#16181c]"
          )}>
            Todas
          </span>
        </Link>
        {categories.map((cat) => (
          <Link key={cat.id} href={q ? `?q=${q}&category=${cat.id}` : `?category=${cat.id}`}>
            <span className={cn(
              "inline-flex items-center px-3.5 py-1.5 text-[12px] font-semibold transition-colors",
              category === cat.id
                ? "bg-[#16181c] text-white"
                : "border border-[#dde0e3] text-[#6b7178] hover:border-[#b5652f] hover:text-[#16181c]"
            )}>
              {cat.name}
            </span>
          </Link>
        ))}
      </div>

      {/* ── Table container ── */}
      <div className="bg-white border border-[#dde0e3]">
        {/* Search bar */}
        <form className="flex gap-2.5 items-center px-4 py-3.5 border-b border-[#eceef0]">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome, SKU..."
            className="flex-1 max-w-[280px] px-3 py-2 bg-[#f5f6f7] border border-[#dde0e3] text-[13px] text-[#21242a] placeholder:text-[#9ba1a8] outline-none focus:border-[#b5652f] transition-colors"
          />
          {category && <input type="hidden" name="category" value={category} />}
          {(q || category) && (
            <Link href="/produtos" className="text-[12px] font-semibold text-[#6b7178] hover:text-[#16181c]">
              Limpar
            </Link>
          )}
        </form>

        {/* Desktop header */}
        <div
          className="hidden sm:grid px-4 py-2.5 bg-[#f5f6f7]"
          style={{ ...mono, fontSize: "11px", color: "#9ba1a8", gridTemplateColumns: "2fr 1fr 0.9fr 0.7fr 0.7fr auto" }}
        >
          <div>PRODUTO</div>
          <div>CATEGORIA</div>
          <div>PREÇO TABELA</div>
          <div>MARGEM</div>
          <div>STATUS</div>
          <div />
        </div>

        {/* Rows */}
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2">
            <Package size={32} className="text-[#dde0e3]" />
            <p className="text-[13px] text-[#9ba1a8]">
              {q || category ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
            </p>
          </div>
        ) : (
          products.map((p) => {
            const margin = calculateMargin(Number(p.listPrice), Number(p.costPrice))
            const status = p.isActive ? "ATIVO" : "INATIVO"
            const marginColor = margin >= 30 ? "#3f7d4e" : margin >= 15 ? "#8a6d00" : "#b23b32"

            return (
              <div key={p.id} className="border-t border-[#eceef0] group">
                {/* Desktop row */}
                <div
                  className="hidden sm:grid items-center px-4 py-3.5 text-[14px] hover:bg-[#f5f6f7] transition-colors"
                  style={{ gridTemplateColumns: "2fr 1fr 0.9fr 0.7fr 0.7fr auto" }}
                >
                  <Link href={`/produtos/${p.id}`} className="font-semibold text-[#16181c] hover:text-[#b5652f] truncate pr-3">
                    {p.name}
                    <span style={mono} className="block text-[11px] font-normal text-[#9ba1a8]">{p.sku}</span>
                  </Link>
                  <div className="text-[#6b7178] text-[13px] truncate pr-3">{p.category.name}</div>
                  <div style={mono} className="text-[13px] text-[#16181c]">
                    {formatCurrency(Number(p.listPrice))}
                  </div>
                  <div style={{ ...mono, fontSize: "13px", fontWeight: 600, color: marginColor }}>
                    {margin.toFixed(1)}%
                  </div>
                  <div><StatusBadge status={status} /></div>
                  <div className="flex justify-end"><ProductActions productId={p.id} isActive={p.isActive} /></div>
                </div>

                {/* Mobile row */}
                <div className="sm:hidden px-4 py-3.5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Link href={`/produtos/${p.id}`} className="font-semibold text-[14px] text-[#16181c] truncate">
                      {p.name}
                    </Link>
                    <StatusBadge status={status} />
                  </div>
                  <p className="text-[12px] text-[#6b7178]">
                    {p.category.name} · {formatCurrency(Number(p.listPrice))} · margem {margin.toFixed(1)}%
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {products.length > 0 && (
        <p style={mono} className="mt-3 text-[11px] text-[#9ba1a8]">
          {products.length} {products.length === 1 ? "produto" : "produtos"}
        </p>
      )}
    </div>
  )
}
