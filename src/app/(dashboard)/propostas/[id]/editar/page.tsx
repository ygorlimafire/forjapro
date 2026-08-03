import { notFound, redirect } from "next/navigation"
import { getProposalById, getCustomersForSelect } from "@/actions/proposals"
import { prisma } from "@/lib/prisma"
import { ProposalForm } from "@/components/proposals/proposal-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { PageProps } from "@/types"

export const metadata = { title: "Editar Proposta — FORJA PRO" }

export default async function EditarPropostaPage({ params }: PageProps) {
  const { id } = await params
  const proposal = await getProposalById(id)
  if (!proposal) notFound()
  if (proposal.frozenAt || ["APROVADA", "RECUSADA"].includes(proposal.status)) {
    redirect(`/propostas/${id}`)
  }

  const [customers, settings, opportunities] = await Promise.all([
    getCustomersForSelect(),
    prisma.companySettings.findFirst({ select: { minMarginPct: true } }),
    prisma.opportunity.findMany({
      where: { deletedAt: null },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ])

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/propostas/${id}`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={15} />
          Proposta {proposal.number}
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold">Editar Proposta {proposal.number}</h1>
        <p className="text-sm text-muted-foreground">Alterações só são permitidas em propostas em rascunho ou negociação</p>
      </div>

      <ProposalForm
        customers={customers}
        opportunities={opportunities}
        minMarginPct={Number(settings?.minMarginPct ?? 15)}
        proposal={proposal}
      />
    </div>
  )
}
