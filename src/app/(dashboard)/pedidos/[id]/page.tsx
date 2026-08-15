import { notFound } from "next/navigation"
import { getOrderById } from "@/actions/orders"
import { auth } from "@/lib/auth"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Package, AlertTriangle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { OrderStatusActions } from "@/components/orders/order-status-actions"
import { OrderNotesForm } from "@/components/orders/order-notes-form"
import type { OrderStatus, ReceivableStatus, StockAlertStatus } from "@prisma/client"
import type { PageProps } from "@/types"

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDENTE: "Pendente",
  CONFIRMADO: "Confirmado",
  AGUARDANDO_EXPEDICAO: "Aguardando Expedição",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
}

const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDENTE: "text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950/30 dark:border-yellow-900/50",
  CONFIRMADO: "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/30 dark:border-blue-900/50",
  AGUARDANDO_EXPEDICAO: "text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950/30 dark:border-purple-900/50",
  ENTREGUE: "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/30 dark:border-green-900/50",
  CANCELADO: "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/30 dark:border-red-900/50",
}

const RECEIVABLE_LABEL: Record<ReceivableStatus, string> = {
  PENDENTE: "A receber",
  PAGO: "Pago",
  VENCIDO: "Vencido",
  CANCELADO: "Cancelado",
}

const STOCK_ALERT: Record<Exclude<StockAlertStatus, "OK">, { label: string; description: string; className: string; iconClass: string }> = {
  PARCIAL: {
    label: "Reserva de estoque parcial",
    description: "O estoque disponível não cobriu todos os itens deste pedido. A quantidade reservada é menor que a vendida. Verifique a necessidade de compra.",
    className: "border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-950/20",
    iconClass: "text-orange-600 dark:text-orange-400",
  },
  INSUFICIENTE: {
    label: "Sem estoque disponível",
    description: "Nenhum item deste pedido pôde ser reservado em estoque. É necessário abrir uma ordem de compra antes da entrega.",
    className: "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20",
    iconClass: "text-red-600 dark:text-red-400",
  },
}

const RECEIVABLE_COLOR: Record<ReceivableStatus, string> = {
  PENDENTE: "text-yellow-700 bg-yellow-50 border-yellow-200",
  PAGO: "text-green-700 bg-green-50 border-green-200",
  VENCIDO: "text-red-700 bg-red-50 border-red-200",
  CANCELADO: "text-muted-foreground bg-muted border-border",
}

export default async function PedidoDetailPage({ params }: PageProps) {
  const { id } = await params
  const [order, session] = await Promise.all([getOrderById(id), auth()])
  if (!order) notFound()

  const userRoleName = (session?.user?.roleName as string | undefined) ?? ""
  const customerName = order.customer.companyName || order.customer.tradeName || order.customer.document
  const totalPaid = order.receivables.filter((r) => r.status === "PAGO").reduce((s, r) => s + Number(r.amount), 0)
  const totalPending = order.receivables.filter((r) => r.status === "PENDENTE").reduce((s, r) => s + Number(r.amount), 0)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link href="/pedidos" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={15} />
          Pedidos
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-xl font-bold font-mono">{order.id.slice(0, 8).toUpperCase()}</h1>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLOR[order.status]}`}>
              {STATUS_LABEL[order.status]}
            </span>
            {order.stockStatus !== "OK" && (() => {
              const alert = STOCK_ALERT[order.stockStatus as Exclude<StockAlertStatus, "OK">]
              return (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${alert.className} ${alert.iconClass}`}>
                  <AlertTriangle size={11} />
                  {alert.label}
                </span>
              )
            })()}
          </div>
          <p className="text-sm text-muted-foreground">
            Proposta{" "}
            <Link href={`/propostas/${order.proposal.id}`} className="underline underline-offset-2 hover:text-foreground">
              {order.proposal.number}
            </Link>
            {" "}· {formatDate(order.createdAt)} · {order.seller.name}
          </p>
        </div>
      </div>

      {/* Status actions */}
      <Card>
        <CardContent className="pt-6">
          <OrderStatusActions
            orderId={order.id}
            currentStatus={order.status}
            stockStatus={order.stockStatus}
            userRoleName={userRoleName}
          />
        </CardContent>
      </Card>

      {/* Stock alert callout */}
      {order.stockStatus !== "OK" && (() => {
        const alert = STOCK_ALERT[order.stockStatus as Exclude<StockAlertStatus, "OK">]
        return (
          <div className={`flex gap-3 p-4 rounded-lg border ${alert.className}`}>
            <AlertTriangle size={18} className={`shrink-0 mt-0.5 ${alert.iconClass}`} />
            <div>
              <p className={`text-sm font-semibold ${alert.iconClass}`}>{alert.label}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{alert.description}</p>
            </div>
          </div>
        )
      })()}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cliente</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{customerName}</p>
            <p className="text-muted-foreground font-mono">{order.customer.document}</p>
            {order.customer.phone && <p className="text-muted-foreground">{order.customer.phone}</p>}
            <Link href={`/clientes/${order.customer.id}`} className="text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground">
              Ver ficha do cliente
            </Link>
          </CardContent>
        </Card>

        {/* Payment info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {order.proposal.paymentCondition && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Condição</span>
                <span>{order.proposal.paymentCondition}</span>
              </div>
            )}
            {order.proposal.installments && order.proposal.installments > 1 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Parcelas</span>
                <span>{order.proposal.installments}×</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">{formatCurrency(Number(order.totalAmount))}</span>
            </div>
            {totalPaid > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recebido</span>
                <span className="text-green-600 font-medium">{formatCurrency(totalPaid)}</span>
              </div>
            )}
            {totalPending > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">A receber</span>
                <span className="text-yellow-600 font-medium">{formatCurrency(totalPending)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Itens ({order.items.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 pb-3 border-b last:border-0 last:pb-0">
              <div className="relative w-12 h-12 rounded border bg-muted shrink-0 overflow-hidden">
                {item.product?.mainImage ? (
                  <Image src={item.product.mainImage} alt="" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={16} className="text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.productName ?? item.product?.name ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{item.product?.sku ?? "—"} · {item.quantity}× {formatCurrency(Number(item.unitPrice))}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-sm">{formatCurrency(Number(item.subtotal))}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Receivables */}
      {order.receivables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Contas a Receber</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {order.receivables.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${RECEIVABLE_COLOR[r.status]}`}>
                    {RECEIVABLE_LABEL[r.status]}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Parcela {r.installment}/{r.totalInstallments} · vence {formatDate(r.dueDate)}
                  </span>
                </div>
                <span className="font-semibold text-sm">{formatCurrency(Number(r.amount))}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Observações internas</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderNotesForm orderId={order.id} initialNotes={order.notes ?? ""} />
        </CardContent>
      </Card>
    </div>
  )
}
