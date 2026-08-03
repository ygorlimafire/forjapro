"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  approveProposal,
  rejectProposal,
  sendProposal,
  duplicateProposal,
} from "@/actions/proposals"
import {
  CheckCircle2,
  XCircle,
  Send,
  Copy,
  Download,
  MessageCircle,
  Loader2,
} from "lucide-react"
import type { ProposalStatus } from "@prisma/client"

interface ProposalActionsProps {
  proposalId: string
  proposalNumber: string
  status: ProposalStatus
  frozenAt: Date | null
  canApprove: boolean
  customerPhone?: string | null
  totalAmount: number
}

export function ProposalActions({
  proposalId,
  proposalNumber,
  status,
  frozenAt,
  canApprove,
  customerPhone,
  totalAmount,
}: ProposalActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  const isFrozen = !!frozenAt

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function handle(action: string, fn: () => Promise<any>) {
    setLoading(action)
    try {
      const result = await fn()
      if (!result.success) {
        toast.error(result.error)
      } else {
        toast.success(
          action === "approve" ? "Proposta aprovada! Pedido e contas a receber criados." :
          action === "reject" ? "Proposta recusada" :
          action === "send" ? "Proposta marcada como enviada" :
          action === "duplicate" ? `Proposta duplicada: ${result.data?.number}` : "Ação realizada"
        )
        if (action === "duplicate" && result.data?.id) {
          router.push(`/propostas/${result.data.id}`)
        } else {
          router.refresh()
        }
      }
    } catch {
      toast.error("Erro ao executar ação")
    } finally {
      setLoading(null)
      setShowRejectForm(false)
    }
  }

  async function handleReject() {
    await handle("reject", () => rejectProposal(proposalId, rejectReason))
  }

  const whatsappText = encodeURIComponent(
    `Olá! Segue a proposta comercial FORJA PRO nº ${proposalNumber} no valor de R$ ${totalAmount.toFixed(2)}. Em anexo o documento completo.`
  )
  const whatsappPhone = customerPhone?.replace(/\D/g, "") || ""
  const whatsappUrl = whatsappPhone
    ? `https://wa.me/55${whatsappPhone}?text=${whatsappText}`
    : `https://wa.me/?text=${whatsappText}`

  return (
    <div className="flex flex-wrap gap-2">
      {/* PDF download */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.open(`/api/proposals/${proposalId}/pdf`, "_blank")}
      >
        <Download size={14} />
        PDF
      </Button>

      {/* WhatsApp */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.open(whatsappUrl, "_blank")}
      >
        <MessageCircle size={14} />
        WhatsApp
      </Button>

      {/* Marcar como enviada */}
      {!isFrozen && status !== "APROVADA" && status !== "RECUSADA" && status !== "ENVIADA" && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handle("send", () => sendProposal(proposalId))}
          disabled={!!loading}
        >
          {loading === "send" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Marcar enviada
        </Button>
      )}

      {/* Duplicar */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handle("duplicate", () => duplicateProposal(proposalId))}
        disabled={!!loading}
      >
        {loading === "duplicate" ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
        Duplicar
      </Button>

      {/* Aprovar */}
      {!isFrozen && status !== "APROVADA" && status !== "RECUSADA" && canApprove && (
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={() => handle("approve", () => approveProposal(proposalId))}
          disabled={!!loading}
        >
          {loading === "approve" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          Aprovar
        </Button>
      )}

      {/* Recusar */}
      {!isFrozen && status !== "APROVADA" && status !== "RECUSADA" && (
        <>
          {!showRejectForm ? (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={() => setShowRejectForm(true)}
            >
              <XCircle size={14} />
              Recusar
            </Button>
          ) : (
            <div className="flex items-end gap-2 w-full mt-2">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Motivo da recusa</Label>
                <Input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ex: Preço fora do orçamento..."
                  className="h-8 text-sm"
                />
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleReject}
                disabled={!!loading}
                className="h-8"
              >
                {loading === "reject" ? <Loader2 size={14} className="animate-spin" /> : null}
                Confirmar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowRejectForm(false)}
                className="h-8"
              >
                Cancelar
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
