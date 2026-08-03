import Link from "next/link"
import { getPurchaseOrders } from "@/actions/purchases"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { Plus, ShoppingCart, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PurchaseOrderStatus } from "@prisma/client"
import type { PageProps } from "@/types"

const STATUS_LABEL: Record<PurchaseOrderStatus, string> = {
  RASCUNHO: "Rascunho",
  ENVIADO: "Enviado",
  CONFIRMADO: "Confirmado",
  RECEBIDO_PARCIAL: "Recebido parcial",
  RECEBIDO_TOTAL: "Recebido",
  CANCELADO: "Cancelado",
}

const STATUS_COLOR: Record<PurchaseOrderStatus, string> = {
  RASCUNHO: "text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900/30 dark:border-gray-800",
  ENVIADO: "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/30 dark:border-blue-900/50",
  CONFIRMADO: "text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950/30 dark:border-purple-900/50",
  RECEBIDO_PARCIAL: "text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950/30 dark:border-orange-900/50",
  RECEBIDO_TOTAL: "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/30 dark:border-green-900/50",
  CANCELADO: "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/30 dark:border-red-900/50",
}

export default async function ComprasPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const status = sp.status as PurchaseOrderStatus | undefined
  const supplierId = sp.fornecedor as string | undefined

  const orders = await getPurchaseOrders({ status, supplierId })

  const statuses: PurchaseOrderStatus[] = [
    "RASCUNHO", "ENVIADO", "CONFIRMADO", "RECEBIDO_PARCIAL", "RECEBIDO_TOTAL", "CANCELADO",
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Pedidos de Compra</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {orders.length} pedido{orders.length !== 1 ? "s" : ""}
            {status ? ` · ${STATUS_LABEL[status]}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/compras/sugeridas" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            <AlertTriangle size={14} />
            Compras sugeridas
          </Link>
          <Link href="/compras/nova" className={cn(buttonVariants({ size: "sm" }))}>
            <Plus size={14} />
            Nova compra
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/compras"
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            !status
              ? "bg-foreground text-background border-foreground"
              : "border-border hover:bg-muted"
          }`}
        >
          Todos
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/compras?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              status === s
                ? "bg-foreground text-background border-foreground"
                : "border-border hover:bg-muted"
            }`}
          >
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      {/* List */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <ShoppingCart size={40} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">Nenhum pedido de compra encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crie um novo pedido ou verifique as compras sugeridas.
            </p>
            <div className="flex gap-2 justify-center mt-4">
              <Link href="/compras/sugeridas" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                Ver sugeridas
              </Link>
              <Link href="/compras/nova" className={cn(buttonVariants({ size: "sm" }))}>
                Nova compra
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {orders.map((po) => {
            const supplierName = po.supplier.tradeName || po.supplier.companyName
            return (
              <Link key={po.id} href={`/compras/${po.id}`}>
                <div className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono font-semibold text-sm">{po.number}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLOR[po.status]}`}>
                        {STATUS_LABEL[po.status]}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {supplierName} · {po._count.items} item{po._count.items !== 1 ? "s" : ""}
                      {po.expectedAt ? ` · Previsão: ${formatDate(po.expectedAt)}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm">{formatCurrency(Number(po.totalAmount))}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(po.createdAt)}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
