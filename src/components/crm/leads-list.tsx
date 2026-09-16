"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { deleteLead } from "@/actions/crm"
import { formatDate } from "@/lib/utils"
import { Trash2, Check, X, Users } from "lucide-react"
import type { LeadStatus, LeadSource } from "@prisma/client"

const STATUS_LABEL: Record<LeadStatus, string> = {
  NOVO: "Novo",
  CONTATO: "Contato",
  QUALIFICADO: "Qualificado",
  CONVERTIDO: "Convertido",
  DESCARTADO: "Descartado",
}

const STATUS_COLOR: Record<LeadStatus, string> = {
  NOVO: "#6b7178",
  CONTATO: "#3b82f6",
  QUALIFICADO: "#16a34a",
  CONVERTIDO: "#b5652f",
  DESCARTADO: "#9ca3af",
}

const SOURCE_LABEL: Record<LeadSource, string> = {
  SITE: "Site",
  INDICACAO: "Indicação",
  INSTAGRAM: "Instagram",
  GOOGLE: "Google",
  FEIRA: "Feira",
  LIGACAO: "Ligação",
  EMAIL: "E-mail",
  OUTRO: "Outro",
}

type Lead = {
  id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  status: LeadStatus
  source: LeadSource | null
  createdAt: Date
  assignee: { name: string } | null
}

const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }

export function LeadsList({ leads, canDelete = false }: { leads: Lead[]; canDelete?: boolean }) {
  const router = useRouter()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [open, setOpen] = useState(false)

  async function handleDelete(id: string) {
    setDeleting(true)
    const result = await deleteLead(id)
    setDeleting(false)
    if (!result.success) {
      toast.error(result.error)
    } else {
      toast.success("Lead excluído")
      setConfirmDelete(null)
      router.refresh()
    }
  }

  if (leads.length === 0 && !open) return null

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 mb-3 group"
      >
        <Users size={14} className="text-[#9ba1a8]" />
        <span style={{ ...mono, fontSize: "11px", color: "#9ba1a8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Leads ({leads.length})
        </span>
        <span style={{ ...mono, fontSize: "11px", color: "#9ba1a8" }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="bg-white border border-[#dde0e3]">
          {leads.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p style={{ ...mono, fontSize: "12px", color: "#9ba1a8" }}>Nenhum lead cadastrado</p>
            </div>
          ) : (
            leads.map((lead, i) => (
              <div
                key={lead.id}
                className={`flex items-center gap-4 px-4 py-3 ${i > 0 ? "border-t border-[#eceef0]" : ""}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[11px] font-semibold px-1.5 py-0.5 rounded"
                      style={{
                        color: STATUS_COLOR[lead.status],
                        background: STATUS_COLOR[lead.status] + "18",
                        fontFamily: "'IBM Plex Mono', monospace",
                      }}
                    >
                      {STATUS_LABEL[lead.status]}
                    </span>
                    <span style={{ ...mono, fontSize: "10px", color: "#9ba1a8" }}>
                      {lead.source ? SOURCE_LABEL[lead.source] : ""}
                    </span>
                  </div>
                  <p className="font-semibold text-[13px] text-[#16181c] mt-0.5">{lead.name}</p>
                  <p style={{ ...mono, fontSize: "11px", color: "#9ba1a8" }}>
                    {[lead.company, lead.email, lead.phone].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p style={{ ...mono, fontSize: "10px", color: "#9ba1a8" }}>{formatDate(lead.createdAt)}</p>
                  {lead.assignee && (
                    <p style={{ ...mono, fontSize: "10px", color: "#9ba1a8" }}>{lead.assignee.name}</p>
                  )}
                  {canDelete && (
                    <div className="flex items-center justify-end gap-1 mt-1">
                      {confirmDelete === lead.id ? (
                        <>
                          <button
                            onClick={() => handleDelete(lead.id)}
                            disabled={deleting}
                            className="text-red-500 hover:text-red-600"
                            title="Confirmar exclusão"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-[#9ba1a8] hover:text-[#16181c]"
                            title="Cancelar"
                          >
                            <X size={12} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(lead.id)}
                          className="text-[#9ba1a8] hover:text-red-500"
                          title="Excluir lead"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
