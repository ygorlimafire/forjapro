import { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { getCategories } from "@/actions/products"
import { ProductForm } from "@/components/products/product-form"

export const metadata: Metadata = { title: "Novo Produto" }

export default async function NovoProdutoPage() {
  const categories = await getCategories()
  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <Link
          href="/produtos"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft size={14} />
          Produtos
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Novo Produto</h1>
        <p className="text-sm text-muted-foreground mt-1">Cadastre um produto do catálogo TRAMA</p>
      </div>
      <ProductForm categories={categories} />
    </div>
  )
}
