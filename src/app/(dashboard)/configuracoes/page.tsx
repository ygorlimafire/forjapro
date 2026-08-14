import { Metadata } from "next"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { can } from "@/lib/rbac"
import { UsersSection } from "@/components/configuracoes/users-section"
import { ExpenseCategoriesPanel } from "@/components/financial/expense-categories-panel"
import { ProductCategoriesPanel } from "@/components/products/product-categories-panel"
import { getAllCategories } from "@/actions/products"

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
        <UsersSection users={users} roles={roles} />
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
