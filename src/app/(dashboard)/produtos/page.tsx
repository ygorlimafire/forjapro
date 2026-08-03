import { Metadata } from "next"
import Link from "next/link"
import { getProducts, getCategories } from "@/actions/products"
import { formatCurrency, calculateMargin } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Package, Search } from "lucide-react"
import { ProductActions } from "@/components/products/product-actions"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Produtos" }

interface Props {
  searchParams: Promise<{ q?: string; category?: string }>
}

export default async function ProdutosPage({ searchParams }: Props) {
  const { q, category } = await searchParams
  const [products, categories] = await Promise.all([
    getProducts(q, category),
    getCategories(),
  ])

  // Counts por categoria para os chips
  const allProducts = q ? await getProducts(undefined, category) : products
  const countByCategory = categories.reduce<Record<string, number>>((acc, cat) => {
    acc[cat.id] = allProducts.filter((p) => p.categoryId === cat.id).length
    return acc
  }, {})

  // Agrupamento por categoria quando não há filtro de texto
  const grouped = !q
    ? categories
        .map((cat) => ({
          cat,
          items: products.filter((p) => p.categoryId === cat.id),
        }))
        .filter((g) => g.items.length > 0)
    : null

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Package size={22} /> Produtos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {products.length} {products.length === 1 ? "produto" : "produtos"} encontrado(s)
          </p>
        </div>
        <Link href="/produtos/novo">
          <Button>
            <Plus size={16} />
            Novo produto
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="space-y-3">
        {/* Campo de busca */}
        <form className="flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar por nome, SKU, descrição..."
              className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {category && <input type="hidden" name="category" value={category} />}
          </div>
          <Button type="submit" variant="secondary" size="sm">Buscar</Button>
          {(q || category) && (
            <Link href="/produtos">
              <Button variant="ghost" size="sm">Limpar</Button>
            </Link>
          )}
        </form>

        {/* Chips de categoria com contador */}
        <div className="flex flex-wrap gap-2">
          <Link href={q ? `?q=${q}` : "/produtos"}>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                !category
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
              )}
            >
              Todas
              <span className={cn(
                "text-[10px] font-normal",
                !category ? "text-primary-foreground/80" : "text-muted-foreground"
              )}>
                ({products.length > 0 && !category ? products.length : allProducts.length})
              </span>
            </span>
          </Link>
          {categories.map((cat) => (
            <Link key={cat.id} href={q ? `?q=${q}&category=${cat.id}` : `?category=${cat.id}`}>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  category === cat.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
                )}
              >
                {cat.name}
                <span className={cn(
                  "text-[10px] font-normal",
                  category === cat.id ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  ({countByCategory[cat.id] ?? 0})
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Listagem */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <Package size={40} className="mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">Nenhum produto encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">
                {q || category ? "Tente outros filtros" : "Cadastre o primeiro produto"}
              </p>
              {!q && !category && (
                <Link href="/produtos/novo" className="mt-4 inline-block">
                  <Button size="sm"><Plus size={14} /> Novo produto</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : grouped ? (
        // Agrupado por categoria (sem filtro de texto)
        <div className="space-y-6">
          {grouped.map(({ cat, items }) => (
            <div key={cat.id}>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-sm font-semibold text-foreground">{cat.name}</h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <ProductTable products={items} />
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        // Lista plana (com filtro de texto ativo)
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <ProductTable products={products} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ProductTable({ products }: { products: Awaited<ReturnType<typeof getProducts>> }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-muted-foreground">
          <th className="text-left py-3 px-4 font-medium">Produto</th>
          <th className="text-left py-3 px-4 font-medium hidden md:table-cell">SKU</th>
          <th className="text-left py-3 px-4 font-medium hidden lg:table-cell">Categoria</th>
          <th className="text-right py-3 px-4 font-medium">Preço Tabela</th>
          <th className="text-right py-3 px-4 font-medium hidden md:table-cell">Custo</th>
          <th className="text-right py-3 px-4 font-medium hidden lg:table-cell">Margem</th>
          <th className="text-left py-3 px-4 font-medium">Status</th>
          <th className="py-3 px-4" />
        </tr>
      </thead>
      <tbody>
        {products.map((p) => {
          const margin = calculateMargin(Number(p.listPrice), Number(p.costPrice))
          return (
            <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
              <td className="py-3 px-4">
                <Link href={`/produtos/${p.id}`} className="hover:underline">
                  <p className="font-medium">{p.name}</p>
                  {p.warranty && (
                    <p className="text-xs text-muted-foreground">Garantia: {p.warranty}</p>
                  )}
                </Link>
              </td>
              <td className="py-3 px-4 text-muted-foreground font-mono text-xs hidden md:table-cell">
                {p.sku}
              </td>
              <td className="py-3 px-4 hidden lg:table-cell">
                <Badge variant="outline" className="text-xs">{p.category.name}</Badge>
              </td>
              <td className="py-3 px-4 text-right font-medium">
                {formatCurrency(Number(p.listPrice))}
              </td>
              <td className="py-3 px-4 text-right text-muted-foreground hidden md:table-cell">
                {formatCurrency(Number(p.costPrice))}
              </td>
              <td className="py-3 px-4 text-right hidden lg:table-cell">
                <span className={margin >= 30 ? "text-green-600" : margin >= 15 ? "text-yellow-600" : "text-red-600"}>
                  {margin.toFixed(1)}%
                </span>
              </td>
              <td className="py-3 px-4">
                <Badge variant={p.isActive ? "default" : "secondary"}>
                  {p.isActive ? "Ativo" : "Inativo"}
                </Badge>
              </td>
              <td className="py-3 px-4">
                <ProductActions productId={p.id} isActive={p.isActive} />
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
