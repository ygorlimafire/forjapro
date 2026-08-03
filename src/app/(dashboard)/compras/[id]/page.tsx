import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { getPurchaseOrderById } from "@/actions/purchases"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ImageIcon, AlertTriangle, CheckCircle2 } from "lucide-react"
import { PurchaseStatusActions } from "@/components/purchases/purchase-status-actions"
import type { PurchaseOrderStatus, StockAlertStatus, PayableStatus } from "@prisma/client"
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

const STOCK_LABEL: Record<StockAlertStatus, string> = {
  OK: "Estoque OK",
  PARCIAL: "Parcial",
  INSUFICIENTE: "Insuficiente",
}

const PAYABLE_LABEL: Record<PayableStatus, string> = {
  PENDENTE: "A pagar",
  PAGO: "Pago",
  VENCIDO: "Vencido",
  CANCELADO: "Cancelado",
}

const PAYABLE_COLOR: Record<PayableStatus, string> = {
  PENDENTE: "text-yellow-700 bg-yellow-50 border-yellow-200",
  PAGO: "text-green-700 bg-green-50 border-green-200",
  VENCIDO: "text-red-700 bg-red-50 border-red-200",
  CANCELADO: "text-muted-foreground bg-muted border-border",
}

export default async function CompraDetailPage({ params }: PageProps) {
  const { id } = await params
  const po = await getPurchaseOrderById(id)
  if (!po) notFound()

  const supplierName = po.supplier.tradeName || po.supplier.companyName
  const totalReceived = po.items.reduce((s, i) => s + i.receivedQty * Number(i.unitCost), 0)
  const totalPending = po.items.reduce(
    (s, i) => s + (i.quantity - i.receivedQty) * Number(i.unitCost),
    0
  )

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link href="/compras" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={15} />
          Compras
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-xl font-bold font-mono">{po.number}</h1>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLOR[po.status]}`}>
              {STATUS_LABEL[po.status]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {supplierName}
            {po.expectedAt ? ` · Previsão: ${formatDate(po.expectedAt)}` : ""}
            {" "}· Criado em {formatDate(po.createdAt)}
          </p>
        </div>
      </div>

      {/* Status actions */}
      <Card>
        <CardContent className="pt-6">
          <PurchaseStatusActions
            purchaseOrderId={po.id}
            currentStatus={po.status}
            items={po.items.map((i) => ({
              id: i.id,
              productId: i.productId,
              quantity: i.quantity,
              unitCost: Number(i.unitCost),
              receivedQty: i.receivedQty,
              product: { name: i.product.name, sku: i.product.sku },
            }))}
          />
        </CardContent>
      </Card>

      {/* Supplier + Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Fornecedor</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{po.supplier.companyName}</p>
            {po.supplier.tradeName && <p className="text-muted-foreground">{po.supplier.tradeName}</p>}
            <p className="text-muted-foreground font-mono">{po.supplier.document}</p>
            {po.supplier.contactName && <p className="text-muted-foreground">{po.supplier.contactName}</p>}
            {po.supplier.phone && <p className="text-muted-foreground">{po.supplier.phone}</p>}
            {po.supplier.email && <p className="text-muted-foreground">{po.supplier.email}</p>}
            {po.supplier.commercialTerms && (
              <p className="text-muted-foreground text-xs mt-2 border-t pt-2">{po.supplier.commercialTerms}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Resumo financeiro</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total pedido</span>
              <span className="font-semibold">{formatCurrency(Number(po.totalAmount))}</span>
            </div>
            {totalReceived > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Já recebido</span>
                <span className="text-green-600 font-medium">{formatCurrency(totalReceived)}</span>
              </div>
            )}
            {totalPending > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pendente</span>
                <span className="text-orange-600 font-medium">{formatCurrency(totalPending)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Itens ({po.items.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {po.items.map((item) => {
            const remaining = item.quantity - item.receivedQty
            const fullyReceived = remaining === 0
            return (
              <div key={item.id} className="flex items-center gap-3 pb-3 border-b last:border-0 last:pb-0">
                <div className="relative w-12 h-12 rounded border bg-muted shrink-0 overflow-hidden">
                  {item.product.mainImage ? (
                    <Image src={item.product.mainImage} alt="" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={14} className="text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">{item.product.sku}</p>
                  <div className="flex flex-wrap gap-2 mt-1 text-xs">
                    <span className="text-muted-foreground">Pedido: {item.quantity}</span>
                    {item.receivedQty > 0 && (
                      <span className="text-green-600">Recebido: {item.receivedQty}</span>
                    )}
                    {remaining > 0 && (
                      <span className="text-orange-600">Pendente: {remaining}</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <p className="font-semibold text-sm">{formatCurrency(Number(item.subtotal))}</p>
                  <p className="text-xs text-muted-foreground">{item.quantity}× {formatCurrency(Number(item.unitCost))}</p>
                  {fullyReceived ? (
                    <div className="flex items-center gap-1 justify-end text-xs text-green-600">
                      <CheckCircle2 size={11} />
                      Recebido
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Linked sales orders */}
      {po.salesOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pedidos de venda vinculados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {po.salesOrders.map((so) => {
              const customerName = so.customer.companyName || so.customer.tradeName || so.customer.document
              return (
                <div key={so.id} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/pedidos/${so.id}`}
                      className="text-sm font-medium underline underline-offset-2 hover:text-muted-foreground"
                    >
                      {so.proposal.number}
                    </Link>
                    <span className="text-sm text-muted-foreground">{customerName}</span>
                  </div>
                  <span className={`text-xs font-medium ${
                    so.stockStatus === "OK"
                      ? "text-green-600"
                      : so.stockStatus === "PARCIAL"
                      ? "text-orange-600"
                      : "text-red-600"
                  }`}>
                    {so.stockStatus === "OK" ? (
                      <span className="flex items-center gap-1"><CheckCircle2 size={11} />{STOCK_LABEL[so.stockStatus]}</span>
                    ) : (
                      <span className="flex items-center gap-1"><AlertTriangle size={11} />{STOCK_LABEL[so.stockStatus]}</span>
                    )}
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {po.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{po.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Payables */}
      {po.payables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Contas a Pagar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {po.payables.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${PAYABLE_COLOR[p.status]}`}>
                    {PAYABLE_LABEL[p.status]}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Vence {formatDate(p.dueDate)}
                    {p.notes ? ` · ${p.notes}` : ""}
                  </span>
                </div>
                <span className="font-semibold text-sm">{formatCurrency(Number(p.amount))}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
