import { getCustomersForSelect } from "@/actions/proposals"
import { prisma } from "@/lib/prisma"
import { ProposalForm } from "@/components/proposals/proposal-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Nova Proposta — FORJA PRO" }

export default async function NovaPropostaPage() {
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
          href="/propostas"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={15} />
          Propostas
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold">Nova Proposta Comercial</h1>
        <p className="text-sm text-muted-foreground">Preencha os dados abaixo para criar um orçamento</p>
      </div>

      <ProposalForm
        customers={customers}
        opportunities={opportunities}
        minMarginPct={Number(settings?.minMarginPct ?? 15)}
      />
    </div>
  )
}
