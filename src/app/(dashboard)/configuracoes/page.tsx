import { Metadata } from "next"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { can } from "@/lib/rbac"
import Link from "next/link"
import { UsersSection } from "@/components/configuracoes/users-section"
import { ExpenseCategoriesPanel } from "@/components/financial/expense-categories-panel"
import { ProductCategoriesPanel } from "@/components/products/product-categories-panel"
import { getAllCategories } from "@/actions/products"
import { getCompanySettings } from "@/lib/company-settings"
import { Building2 } from "lucide-react"

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

  const [users, roles, expenseCategories, productCategories, companySettings] = await Promise.all([
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
    getCompanySettings(),
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

      {/* ── Empresa ── */}
      {can(session.user.permissions, "configuracoes", "edit") && (
        <div className="bg-white border border-[#dde0e3] p-[22px]">
          <SectionTitle>Empresa</SectionTitle>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#f5f6f7] border border-[#dde0e3] flex items-center justify-center">
                {companySettings.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={companySettings.logo} alt="logo" className="w-6 h-6 object-contain" />
                ) : (
                  <Building2 size={16} className="text-[#6b7178]" />
                )}
              </div>
              <div>
                <p className="font-semibold text-[14px] text-[#16181c]">{companySettings.name}</p>
                {companySettings.slogan && (
                  <p style={{ ...mono, fontSize: "11px", color: "#9ba1a8" }}>{companySettings.slogan}</p>
                )}
              </div>
            </div>
            <Link href="/configuracoes/empresa"
              className="btn-clip px-4 py-2 text-white text-[13px]"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Editar
            </Link>
          </div>
        </div>
      )}

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
