import { getProposals } from "@/actions/proposals"
import { ProposalList } from "@/components/proposals/proposal-list"
import { FileText } from "lucide-react"

export const metadata = { title: "Propostas — FORJA PRO" }

export default async function PropostasPage() {
  const proposals = await getProposals()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <FileText size={22} className="text-muted-foreground" />
        <div>
          <h1 className="text-xl font-bold">Propostas Comerciais</h1>
          <p className="text-sm text-muted-foreground">{proposals.length} proposta{proposals.length !== 1 ? "s" : ""} no sistema</p>
        </div>
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <ProposalList proposals={proposals as any} />
    </div>
  )
}
