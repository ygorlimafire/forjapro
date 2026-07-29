import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getProductById, getCategories } from "@/actions/products"
import { ProductForm } from "@/components/products/product-form"
import { ChevronLeft } from "lucide-react"

export const metadata: Metadata = { title: "Editar Produto" }

interface Props { params: Promise<{ id: string }> }

export default async function EditarProdutoPage({ params }: Props) {
  const { id } = await params
  const [product, categories] = await Promise.all([
    getProductById(id),
    getCategories(),
  ])
  if (!product) notFound()

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <Link
          href={`/produtos/${id}`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft size={14} />
          {product.name}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Editar Produto</h1>
      </div>
      <ProductForm product={product} categories={categories} />
    </div>
  )
}
