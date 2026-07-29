import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getProductById } from "@/actions/products"
import { formatCurrency, calculateMargin } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, Pencil } from "lucide-react"
import Image from "next/image"

export const metadata: Metadata = { title: "Detalhes do Produto" }

interface Props { params: Promise<{ id: string }> }

export default async function ProdutoDetailPage({ params }: Props) {
  const { id } = await params
  const product = await getProductById(id)
  if (!product) notFound()

  const margin = calculateMargin(Number(product.listPrice), Number(product.costPrice))
  const specs = product.technicalSpecs as Record<string, string> | null

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <Link
          href="/produtos"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft size={14} />
          Produtos
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{product.sku}</code>
              <Badge variant="outline">{product.category.name}</Badge>
              <Badge variant={product.isActive ? "default" : "secondary"}>
                {product.isActive ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </div>
          <Link href={`/produtos/${id}/editar`}>
            <Button variant="outline" size="sm">
              <Pencil size={14} /> Editar
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Imagem */}
          {product.mainImage && (
            <Card>
              <CardContent className="pt-6">
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={product.mainImage}
                    alt={product.name}
                    fill
                    className="object-contain"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Descrição */}
          {product.description && (
            <Card>
              <CardHeader><CardTitle className="text-base">Descrição Comercial</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{product.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Ficha técnica */}
          {specs && Object.keys(specs).length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Ficha Técnica</CardTitle></CardHeader>
              <CardContent>
                <dl className="grid gap-2">
                  {Object.entries(specs).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-2 gap-2 py-2 border-b last:border-0">
                      <dt className="text-sm text-muted-foreground">{key}</dt>
                      <dd className="text-sm font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar — preços */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Preços</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Preço de tabela</p>
                <p className="text-2xl font-bold">{formatCurrency(Number(product.listPrice))}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Custo TRAMA</p>
                <p className="text-lg font-semibold">{formatCurrency(Number(product.costPrice))}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Margem real</p>
                <p className={`text-xl font-bold ${margin >= 30 ? "text-green-600" : margin >= 15 ? "text-yellow-600" : "text-red-600"}`}>
                  {margin.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Lucro: {formatCurrency(Number(product.listPrice) - Number(product.costPrice))}
                </p>
              </div>
              {product.desiredMargin && (
                <div>
                  <p className="text-xs text-muted-foreground">Margem desejada</p>
                  <p className="text-sm font-medium">{Number(product.desiredMargin).toFixed(1)}%</p>
                </div>
              )}
              {product.warranty && (
                <div>
                  <p className="text-xs text-muted-foreground">Garantia</p>
                  <p className="text-sm font-medium">{product.warranty}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
