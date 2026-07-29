import { Metadata } from "next"
import Link from "next/link"
import { getProducts, getCategories } from "@/actions/products"
import { formatCurrency, calculateMargin } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, Package, Search } from "lucide-react"
import { ProductActions } from "@/components/products/product-actions"

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
      <Card>
        <CardContent className="pt-4 pb-4">
          <form className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Buscar por nome, SKU, descrição..."
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <select
              name="category"
              defaultValue={category}
              className="px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Todas as categorias</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <Button type="submit" variant="secondary">Filtrar</Button>
          </form>
        </CardContent>
      </Card>

      {/* Grid de produtos */}
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
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Catálogo de Produtos</CardTitle>
            <CardDescription>Equipamentos profissionais para cozinhas comerciais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-3 px-2 font-medium">Produto</th>
                    <th className="text-left py-3 px-2 font-medium hidden md:table-cell">SKU</th>
                    <th className="text-left py-3 px-2 font-medium hidden lg:table-cell">Categoria</th>
                    <th className="text-right py-3 px-2 font-medium">Preço Tabela</th>
                    <th className="text-right py-3 px-2 font-medium hidden md:table-cell">Custo</th>
                    <th className="text-right py-3 px-2 font-medium hidden lg:table-cell">Margem</th>
                    <th className="text-left py-3 px-2 font-medium">Status</th>
                    <th className="py-3 px-2" />
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const margin = calculateMargin(
                      Number(p.listPrice),
                      Number(p.costPrice)
                    )
                    return (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-2">
                          <Link href={`/produtos/${p.id}`} className="hover:underline">
                            <p className="font-medium">{p.name}</p>
                            {p.warranty && (
                              <p className="text-xs text-muted-foreground">Garantia: {p.warranty}</p>
                            )}
                          </Link>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground font-mono text-xs hidden md:table-cell">
                          {p.sku}
                        </td>
                        <td className="py-3 px-2 hidden lg:table-cell">
                          <Badge variant="outline" className="text-xs">{p.category.name}</Badge>
                        </td>
                        <td className="py-3 px-2 text-right font-medium">
                          {formatCurrency(Number(p.listPrice))}
                        </td>
                        <td className="py-3 px-2 text-right text-muted-foreground hidden md:table-cell">
                          {formatCurrency(Number(p.costPrice))}
                        </td>
                        <td className="py-3 px-2 text-right hidden lg:table-cell">
                          <span className={margin >= 30 ? "text-green-600" : margin >= 15 ? "text-yellow-600" : "text-red-600"}>
                            {margin.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant={p.isActive ? "default" : "secondary"}>
                            {p.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          <ProductActions productId={p.id} isActive={p.isActive} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
