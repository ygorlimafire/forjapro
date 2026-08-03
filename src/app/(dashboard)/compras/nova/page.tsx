import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getSuppliers } from "@/actions/purchases"
import { getProductById } from "@/actions/products"
import { PurchaseForm } from "@/components/purchases/purchase-form"
import type { PageProps } from "@/types"

export default async function NovaCompraPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const prefillProductId = sp.produto as string | undefined
  const prefillQty = sp.qty ? parseInt(sp.qty as string) : undefined
  const prefillLinkedOrderIds = sp.pedidos
    ? (sp.pedidos as string).split(",").filter(Boolean)
    : undefined

  const [suppliers, prefillProduct] = await Promise.all([
    getSuppliers(),
    prefillProductId ? getProductById(prefillProductId) : Promise.resolve(null),
  ])

  const prefillItem = prefillProduct
    ? {
        productId: prefillProduct.id,
        productName: prefillProduct.name,
        productSku: prefillProduct.sku,
        productImage: prefillProduct.mainImage ?? null,
        quantity: prefillQty ?? 1,
        unitCost: Number(prefillProduct.costPrice),
      }
    : undefined

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/compras" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={15} />
          Compras
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold">Novo Pedido de Compra</h1>
        {prefillLinkedOrderIds?.length ? (
          <p className="text-sm text-muted-foreground mt-0.5">
            Vinculado a {prefillLinkedOrderIds.length} pedido{prefillLinkedOrderIds.length !== 1 ? "s" : ""} de venda
          </p>
        ) : null}
      </div>

      <PurchaseForm
        suppliers={suppliers}
        prefillItem={prefillItem}
        prefillLinkedOrderIds={prefillLinkedOrderIds}
      />
    </div>
  )
}
