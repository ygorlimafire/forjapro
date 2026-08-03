import Link from "next/link"
import Image from "next/image"
import { getSuggestedPurchases } from "@/actions/purchases"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowLeft, Package, ShoppingCart, TrendingDown, AlertTriangle } from "lucide-react"
import { SuggestedPurchaseActions } from "@/components/purchases/suggested-purchase-actions"

export default async function ComprasSugeridasPage() {
  const { suggestions, pendingOrders } = await getSuggestedPurchases()

  const ordersById = new Map(pendingOrders.map((o) => [o.id, o]))

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/compras" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={15} />
          Compras
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Compras Sugeridas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Produtos com estoque abaixo do mínimo ou com pedidos de venda aguardando.
          </p>
        </div>
        {suggestions.length > 0 && (
          <Link href="/compras/nova" className={cn(buttonVariants({ size: "sm" }))}>
            <ShoppingCart size={14} />
            Nova compra
          </Link>
        )}
      </div>

      {/* Pending orders summary */}
      {pendingOrders.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-950/20">
          <AlertTriangle size={18} className="shrink-0 mt-0.5 text-orange-600 dark:text-orange-400" />
          <div>
            <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">
              {pendingOrders.length} pedido{pendingOrders.length !== 1 ? "s" : ""} de venda com estoque insuficiente
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {pendingOrders.map((o) => (
                <Link
                  key={o.id}
                  href={`/pedidos/${o.id}`}
                  className="text-xs px-2 py-0.5 rounded border border-orange-300 bg-orange-100 text-orange-800 hover:bg-orange-200 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300 transition-colors"
                >
                  {o.proposal.number}
                  {" · "}
                  {o.customer.companyName || o.customer.tradeName || o.customer.document}
                  {" · "}
                  <span className={o.stockStatus === "INSUFICIENTE" ? "font-semibold" : ""}>
                    {o.stockStatus === "INSUFICIENTE" ? "Sem estoque" : "Parcial"}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Suggestions list */}
      {suggestions.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <TrendingDown size={40} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">Nenhuma compra sugerida no momento</p>
            <p className="text-sm text-muted-foreground mt-1">
              Todos os produtos estão acima do estoque mínimo e os pedidos estão com reservas completas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s) => {
            const relatedOrders = s.relatedOrderIds.map((id) => ordersById.get(id)).filter(Boolean)
            return (
              <Card key={s.productId}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-4">
                    {/* Product image */}
                    <div className="relative w-14 h-14 rounded-md border bg-muted shrink-0 overflow-hidden">
                      {s.productImage ? (
                        <Image src={s.productImage} alt="" fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={18} className="text-muted-foreground/40" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-sm">{s.productName}</p>
                          <p className="text-xs text-muted-foreground">{s.productSku} · {s.category}</p>
                        </div>
                        <SuggestedPurchaseActions
                          productId={s.productId}
                          productName={s.productName}
                          productSku={s.productSku}
                          suggestedQty={s.suggestedQty}
                          relatedOrderIds={s.relatedOrderIds}
                        />
                      </div>

                      {/* Stock stats */}
                      <div className="flex flex-wrap gap-4 mt-3 text-xs">
                        <div>
                          <span className="text-muted-foreground">Disponível: </span>
                          <span className={`font-semibold ${s.availableQty === 0 ? "text-red-600" : s.availableQty < s.stockMin ? "text-orange-600" : ""}`}>
                            {s.availableQty}
                          </span>
                          {s.stockMin > 0 && (
                            <span className="text-muted-foreground"> / mín. {s.stockMin}</span>
                          )}
                        </div>
                        {s.deficitFromMin > 0 && (
                          <div>
                            <span className="text-muted-foreground">Déficit s/ mínimo: </span>
                            <span className="font-semibold text-orange-600">+{s.deficitFromMin}</span>
                          </div>
                        )}
                        {s.neededForOrders > 0 && (
                          <div>
                            <span className="text-muted-foreground">Faltando para pedidos: </span>
                            <span className="font-semibold text-red-600">+{s.neededForOrders}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Sugerido: </span>
                          <span className="font-bold">{s.suggestedQty} un.</span>
                        </div>
                      </div>

                      {/* Related orders */}
                      {relatedOrders.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="text-xs text-muted-foreground">Pedidos aguardando:</span>
                          {relatedOrders.map((o) => o && (
                            <Link
                              key={o.id}
                              href={`/pedidos/${o.id}`}
                              className="text-xs px-1.5 py-0.5 rounded border border-border bg-muted hover:bg-muted/80 transition-colors"
                            >
                              {o.proposal.number}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
