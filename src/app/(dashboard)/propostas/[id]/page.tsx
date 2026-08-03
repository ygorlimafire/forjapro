import { notFound } from "next/navigation"
import { getProposalById } from "@/actions/proposals"
import { auth } from "@/lib/auth"
import { can } from "@/lib/rbac"
import { ProposalStatusBadge } from "@/components/proposals/proposal-status-badge"
import { ProposalActions } from "@/components/proposals/proposal-actions"
import { MarginAlert } from "@/components/proposals/margin-alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ArrowLeft, Edit, ImageIcon, Lock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { PageProps } from "@/types"

export default async function PropostaDetailPage({ params }: PageProps) {
  const { id } = await params
  const [proposal, session] = await Promise.all([getProposalById(id), auth()])
  if (!proposal) notFound()

  const canApprove = can(session?.user?.permissions ?? [], "propostas", "approve")
  const totalProducts = Number(proposal.totalProducts)
  const totalAmount = Number(proposal.totalAmount)
  const freight = Number(proposal.freight)
  const marginPct = Number(proposal.estimatedMarginPct ?? 0)
  const minMarginPct = Number(proposal.minMarginPct)
  const customerName = proposal.customer.companyName || proposal.customer.tradeName || proposal.customer.document
  const primaryContact = proposal.customer.contacts?.[0]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/propostas" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={15} />
          Propostas
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold font-mono">{proposal.number}</h1>
            <ProposalStatusBadge status={proposal.status} />
            {proposal.frozenAt && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Lock size={11} /> Congelada
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Criada em {formatDate(proposal.createdAt)} · Vendedor: {proposal.seller.name}
          </p>
        </div>

        {!proposal.frozenAt && !["APROVADA", "RECUSADA"].includes(proposal.status) && (
          <Link href={`/propostas/${id}/editar`}>
            <Button variant="outline" size="sm">
              <Edit size={14} />
              Editar
            </Button>
          </Link>
        )}
      </div>

      {/* Margin alert */}
      {marginPct < minMarginPct && proposal.status !== "APROVADA" && (
        <MarginAlert currentMargin={marginPct} minMargin={minMarginPct} />
      )}

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <ProposalActions
            proposalId={id}
            proposalNumber={proposal.number}
            status={proposal.status}
            frozenAt={proposal.frozenAt}
            canApprove={canApprove}
            customerPhone={primaryContact?.phone || proposal.customer.phone}
            totalAmount={totalAmount}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cliente</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{customerName}</p>
            {proposal.customer.tradeName && (
              <p className="text-muted-foreground">{proposal.customer.tradeName}</p>
            )}
            <p className="text-muted-foreground font-mono">{proposal.customer.document}</p>
            {primaryContact && (
              <p className="text-muted-foreground pt-1">
                {primaryContact.name}
                {primaryContact.phone && ` · ${primaryContact.phone}`}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Proposal info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Dados do Orçamento</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Natureza</span>
              <span>{proposal.nature}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Validade</span>
              <span>{formatDate(proposal.validityDate)} ({proposal.validityDays} dias)</span>
            </div>
            {proposal.paymentCondition && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pagamento</span>
                <span>{proposal.paymentCondition}{proposal.installments && proposal.installments > 1 ? ` · ${proposal.installments}×` : ""}</span>
              </div>
            )}
            {proposal.approvedBy && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aprovada por</span>
                <span>{proposal.approvedBy.name}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Itens ({proposal.items.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {proposal.items.map((item, idx) => (
            <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border bg-muted shrink-0">
                {item.productImage ? (
                  <Image src={item.productImage} alt={item.productName} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={20} className="text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{idx + 1}. {item.productName}</p>
                    <p className="text-xs text-muted-foreground">{item.productSku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm">{formatCurrency(Number(item.subtotal))}</p>
                    <p className="text-xs text-muted-foreground">{item.quantity}× {formatCurrency(Number(item.netPrice))}</p>
                  </div>
                </div>
                <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                  {Number(item.discountPct) > 0 && <span>Desc: {Number(item.discountPct)}%</span>}
                  {Number(item.ipiPct) > 0 && <span>IPI: {Number(item.ipiPct)}%</span>}
                  <span>Margem: <span className={Number(item.estimatedMarginPct ?? 0) < minMarginPct ? "text-red-600 font-medium" : ""}>{Number(item.estimatedMarginPct ?? 0).toFixed(1)}%</span></span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm max-w-xs ml-auto">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Produtos</span>
              <span>{formatCurrency(totalProducts)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frete</span>
              <span>{formatCurrency(freight)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t font-semibold text-base">
              <span>Total</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Margem estimada</span>
              <span className={marginPct < minMarginPct ? "text-red-600" : ""}>{marginPct.toFixed(1)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {(proposal.additionalInfo || proposal.notes) && (
        <div className="grid gap-4 md:grid-cols-2">
          {proposal.additionalInfo && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Informações adicionais</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground whitespace-pre-wrap">{proposal.additionalInfo}</CardContent>
            </Card>
          )}
          {proposal.notes && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Notas internas</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground whitespace-pre-wrap">{proposal.notes}</CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Order created */}
      {proposal.order && (
        <Card className="border-green-200 bg-green-50/30 dark:border-green-900/50 dark:bg-green-950/10">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              Pedido criado: {proposal.order.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
              {proposal.order.receivables.length} parcela{proposal.order.receivables.length !== 1 ? "s" : ""} a receber · Status: {proposal.order.status}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
