import { getProposals } from "@/actions/proposals"
import { ProposalList } from "@/components/proposals/proposal-list"
import Link from "next/link"

export const metadata = { title: "Propostas — FORJA PRO" }

const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }

export default async function PropostasPage() {
  const proposals = await getProposals()

  return (
    <div className="p-6 bg-background min-h-full">
      {/* ── Header ── */}
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <p style={{ ...mono, fontSize: "11px", color: "#9ba1a8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            COMERCIAL
          </p>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "34px", color: "#16181c", lineHeight: 1, marginTop: "2px" }}>
            Propostas
          </h1>
        </div>
        <Link
          href="/propostas/nova"
          className="btn-clip text-white inline-flex items-center px-5 py-2.5 font-display font-bold text-[14px] uppercase tracking-[0.02em]"
        >
          Nova Proposta
        </Link>
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <ProposalList proposals={proposals as any} />
    </div>
  )
}
