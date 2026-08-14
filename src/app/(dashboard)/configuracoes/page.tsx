import { Metadata } from "next"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { can } from "@/lib/rbac"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { StatusBadge } from "@/components/ui/status-badge"
import { UserActions } from "@/components/shared/user-actions"
import { ExpenseCategoriesPanel } from "@/components/financial/expense-categories-panel"
import { ProductCategoriesPanel } from "@/components/products/product-categories-panel"
import { getAllCategories } from "@/actions/products"
import { Users } from "lucide-react"

export const metadata: Metadata = { title: "Configurações" }

const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: "'Barlow Condensed', sans-serif",
      fontWeight: 700,
      fontSize: "16px",
      color: "#16181c",
      textTransform: "uppercase",
      letterSpacing: "0.02em",
      marginBottom: "16px",
    }}>
      {children}
    </h2>
  )
}

export default async function ConfiguracoesPage() {
  const session = await auth()
  if (!session?.user || !can(session.user.permissions, "configuracoes", "view")) {
    redirect("/dashboard")
  }

  const [users, roles, expenseCategories, productCategories] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null },
      include: { role: true },
      orderBy: { name: "asc" },
    }),
    prisma.role.findMany({
      include: { _count: { select: { users: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.expenseCategory.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] }),
    getAllCategories(),
  ])

  return (
    <div className="p-6 bg-background min-h-full space-y-6">
      {/* ── Header ── */}
      <div>
        <p style={{ ...mono, fontSize: "11px", color: "#9ba1a8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          SISTEMA
        </p>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "34px", color: "#16181c", lineHeight: 1, marginTop: "2px" }}>
          Configurações
        </h1>
      </div>

      {/* ── Usuários ── */}
      <div className="bg-white border border-[#dde0e3] p-[22px]">
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Usuários</SectionTitle>
          <Link
            href="/configuracoes/usuarios/novo"
            className="btn-clip text-white inline-flex items-center px-4 py-2 font-display font-bold text-[13px] uppercase tracking-[0.02em]"
          >
            Novo Usuário
          </Link>
        </div>

        {/* Desktop header */}
        <div
          className="hidden sm:grid px-0 py-2 bg-[#f5f6f7] px-3"
          style={{ ...mono, fontSize: "11px", color: "#9ba1a8", gridTemplateColumns: "1.5fr 1.5fr 1fr 0.7fr 0.8fr auto" }}
        >
          <div>NOME</div>
          <div>E-MAIL</div>
          <div>PERFIL</div>
          <div>STATUS</div>
          <div>DESDE</div>
          <div />
        </div>

        <div className="border border-[#eceef0] mt-0">
          {users.length === 0 ? (
            <div className="flex items-center justify-center py-10 gap-2">
              <Users size={28} className="text-[#dde0e3]" />
              <p className="text-[13px] text-[#9ba1a8]">Nenhum usuário cadastrado</p>
            </div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="border-b border-[#eceef0] last:border-0">
                {/* Desktop */}
                <div
                  className="hidden sm:grid items-center px-3 py-3 text-[14px] hover:bg-[#f5f6f7] transition-colors"
                  style={{ gridTemplateColumns: "1.5fr 1.5fr 1fr 0.7fr 0.8fr auto" }}
                >
                  <div className="font-semibold text-[#16181c] truncate pr-3">{user.name}</div>
                  <div style={mono} className="text-[#6b7178] text-[13px] truncate pr-3">{user.email}</div>
                  <div className="text-[#6b7178] text-[13px]">{user.role.label}</div>
                  <div><StatusBadge status={user.isActive ? "ATIVO" : "INATIVO"} /></div>
                  <div style={mono} className="text-[#6b7178] text-[12px]">{formatDate(user.createdAt)}</div>
                  <div className="flex justify-end"><UserActions userId={user.id} /></div>
                </div>
                {/* Mobile */}
                <div className="sm:hidden px-3 py-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-[14px] text-[#16181c]">{user.name}</span>
                    <StatusBadge status={user.isActive ? "ATIVO" : "INATIVO"} />
                  </div>
                  <p style={mono} className="text-[12px] text-[#6b7178]">
                    {user.email} · {user.role.label}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Perfis de Acesso ── */}
      <div className="bg-white border border-[#dde0e3] p-[22px]">
        <SectionTitle>Perfis de Acesso</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <div key={role.id} className="border border-[#eceef0] p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-[14px] text-[#16181c]">{role.label}</p>
                <span style={{ ...mono, fontSize: "11px", color: "#9ba1a8" }}>
                  {role._count.users} usuário{role._count.users !== 1 ? "s" : ""}
                </span>
              </div>
              {role.description && (
                <p className="text-[12px] text-[#6b7178] mt-1">{role.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Categorias de Despesa ── */}
      <div className="bg-white border border-[#dde0e3] p-[22px]">
        <SectionTitle>Categorias de Despesa</SectionTitle>
        <ExpenseCategoriesPanel categories={expenseCategories} />
      </div>

      {/* ── Categorias de Produtos ── */}
      <div className="bg-white border border-[#dde0e3] p-[22px]">
        <SectionTitle>Categorias de Produtos</SectionTitle>
        <ProductCategoriesPanel categories={productCategories} />
      </div>
    </div>
  )
}
