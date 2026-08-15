import { Metadata } from "next"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { can } from "@/lib/rbac"
import { getCustomers } from "@/actions/customers"
import { StatusBadge } from "@/components/ui/status-badge"
import { CustomerActions } from "@/components/customers/customer-actions"
import { Users } from "lucide-react"

export const metadata: Metadata = { title: "Clientes" }

interface Props {
  searchParams: Promise<{ q?: string }>
}

const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }

export default async function ClientesPage({ searchParams }: Props) {
  const { q } = await searchParams
  const [session, customers] = await Promise.all([auth(), getCustomers(q)])
  const canDelete = session?.user ? can(session.user.permissions, "clientes", "delete") : false

  return (
    <div className="p-6 bg-background min-h-full">
      {/* ── Header ── */}
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <p style={{ ...mono, fontSize: "11px", color: "#9ba1a8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            CADASTRO
          </p>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "34px", color: "#16181c", lineHeight: 1, marginTop: "2px" }}>
            Clientes
          </h1>
        </div>
        <Link
          href="/clientes/novo"
          className="btn-clip text-white inline-flex items-center px-5 py-2.5 font-display font-bold text-[14px] uppercase tracking-[0.02em]"
        >
          Novo Cliente
        </Link>
      </div>

      {/* ── Table container ── */}
      <div className="bg-white border border-[#dde0e3]">
        {/* Search bar */}
        <form className="flex gap-2.5 items-center px-4 py-3.5 border-b border-[#eceef0]">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar cliente..."
            className="flex-1 max-w-[280px] px-3 py-2 bg-[#f5f6f7] border border-[#dde0e3] text-[13px] text-[#21242a] placeholder:text-[#9ba1a8] outline-none focus:border-[#b5652f] transition-colors"
          />
          {q && (
            <Link href="/clientes" className="text-[12px] font-semibold text-[#6b7178] hover:text-[#16181c]">
              Limpar
            </Link>
          )}
        </form>

        {/* Desktop header */}
        <div
          className="hidden sm:grid px-4 py-2.5 bg-[#f5f6f7]"
          style={{ ...mono, fontSize: "11px", color: "#9ba1a8", gridTemplateColumns: "2fr 1fr 1fr 0.7fr auto" }}
        >
          <div>NOME</div>
          <div>CIDADE/UF</div>
          <div>TELEFONE</div>
          <div>STATUS</div>
          <div />
        </div>

        {/* Rows */}
        {customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2">
            <Users size={32} className="text-[#dde0e3]" />
            <p className="text-[13px] text-[#9ba1a8]">
              {q ? "Nenhum cliente encontrado para esta busca" : "Nenhum cliente cadastrado"}
            </p>
          </div>
        ) : (
          customers.map((c) => {
            const name = c.companyName || c.tradeName || "—"
            const location = c.city && c.state ? `${c.city}/${c.state}` : c.city || "—"
            const status = c.isActive ? "ATIVO" : "INATIVO"

            return (
              <div key={c.id} className="border-t border-[#eceef0] group">
                {/* Desktop row */}
                <div
                  className="hidden sm:grid items-center px-4 py-3.5 text-[14px] hover:bg-[#f5f6f7] transition-colors"
                  style={{ gridTemplateColumns: "2fr 1fr 1fr 0.7fr auto" }}
                >
                  <Link href={`/clientes/${c.id}`} className="font-semibold text-[#16181c] hover:text-[#b5652f] truncate pr-3">
                    {name}
                    {c.tradeName && c.companyName && (
                      <span className="block text-[12px] font-normal text-[#6b7178]">{c.tradeName}</span>
                    )}
                  </Link>
                  <div className="text-[#6b7178] truncate pr-3">{location}</div>
                  <div style={mono} className="text-[#6b7178] text-[13px]">{c.phone || "—"}</div>
                  <div><StatusBadge status={status} /></div>
                  <div className="flex justify-end"><CustomerActions customerId={c.id} canDelete={canDelete} /></div>
                </div>

                {/* Mobile row */}
                <div className="sm:hidden px-4 py-3.5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Link href={`/clientes/${c.id}`} className="font-semibold text-[14px] text-[#16181c] truncate">
                      {name}
                    </Link>
                    <StatusBadge status={status} />
                  </div>
                  <p className="text-[12px] text-[#6b7178]">
                    {location}{c.phone ? ` · ${c.phone}` : ""}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {customers.length > 0 && (
        <p style={mono} className="mt-3 text-[11px] text-[#9ba1a8]">
          {customers.length} {customers.length === 1 ? "cliente" : "clientes"}
        </p>
      )}
    </div>
  )
}
