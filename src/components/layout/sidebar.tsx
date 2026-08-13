"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { can } from "@/lib/rbac"
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Warehouse,
  DollarSign,
  BarChart3,
  Settings,
  Target,
  FileText,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Truck,
  LogOut,
} from "lucide-react"
import { getInitials } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { handleSignOut } from "@/actions/auth"

interface SidebarProps {
  userPermissions: string[]
  userName: string
  userRole: string
  collapsed: boolean
  mobileOpen: boolean
  onCollapse: () => void
  onMobileClose: () => void
}

const navItems = [
  { title: "Dashboard",     href: "/dashboard",    module: "dashboard" },
  { title: "CRM",           href: "/crm",           module: "crm" },
  { title: "Clientes",      href: "/clientes",      module: "clientes" },
  { title: "Propostas",     href: "/propostas",     module: "propostas" },
  { title: "Pedidos",       href: "/pedidos",       module: "pedidos" },
  { title: "Produtos",      href: "/produtos",      module: "produtos" },
  { title: "Estoque",       href: "/estoque",       module: "estoque" },
  { title: "Compras",       href: "/compras",       module: "compras" },
  { title: "Fornecedores",  href: "/fornecedores",  module: "compras" },
  { title: "Financeiro",    href: "/financeiro",    module: "financeiro" },
  { title: "Relatórios",    href: "/relatorios",    module: "relatorios" },
  { title: "Configurações", href: "/configuracoes", module: "configuracoes" },
]

/* Right-leaning parallelogram — industrial motif */
function NavShape({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        display: "block",
        flexShrink: 0,
        width: "7px",
        height: "14px",
        clipPath: "polygon(0 15%, 100% 0, 100% 100%, 0 85%)",
        backgroundColor: active ? "var(--copper-600)" : "rgba(255,255,255,0.18)",
        transition: "background-color 0.2s",
      }}
    />
  )
}

function NavItem({
  href,
  title,
  active,
  collapsed,
  onClick,
}: {
  href: string
  title: string
  active: boolean
  collapsed: boolean
  onClick?: () => void
}) {
  const linkClass = cn(
    "flex items-center border-l-[3px] w-full transition-colors",
    collapsed ? "justify-center px-2 py-3" : "gap-3 pl-[13px] pr-4 py-2.5",
    active
      ? "border-[var(--copper-600)] bg-white/[0.05] text-white"
      : "border-transparent text-[var(--steel-600)] hover:bg-white/[0.04] hover:text-white"
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={<Link href={href} className={linkClass} onClick={onClick} />}
        >
          <NavShape active={active} />
        </TooltipTrigger>
        <TooltipContent side="right">{title}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Link href={href} className={linkClass} onClick={onClick}>
      <NavShape active={active} />
      <span className="font-display font-semibold text-[13px] tracking-[0.01em] whitespace-nowrap uppercase">
        {title}
      </span>
    </Link>
  )
}

function Logo({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center h-[60px] shrink-0 border-b border-white/[0.07]",
        collapsed ? "justify-center px-2" : "px-4 gap-3"
      )}
    >
      <div className="w-8 h-8 shrink-0 flex items-center justify-center border border-[var(--copper-600)]/40 bg-[var(--copper-600)]/10">
        <span className="font-display font-bold text-[var(--copper-600)] text-sm leading-none">F</span>
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <p className="font-display font-bold text-white text-[15px] leading-none tracking-[0.05em] uppercase">
            FORJA PRO
          </p>
          <p className="font-mono text-[9px] text-[var(--steel-600)] tracking-[0.08em] uppercase mt-0.5">
            Gestão Comercial
          </p>
        </div>
      )}
    </div>
  )
}

function UserSection({
  userName,
  userRole,
  collapsed,
  onCollapse,
}: {
  userName: string
  userRole: string
  collapsed: boolean
  onCollapse: () => void
}) {
  return (
    <div className="shrink-0 border-t border-white/[0.07]">
      {!collapsed ? (
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.07]">
          <div className="w-7 h-7 shrink-0 flex items-center justify-center bg-[var(--copper-600)]/15">
            <span className="font-display font-bold text-[11px] text-[var(--copper-600)] leading-none">
              {getInitials(userName)}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-white leading-none truncate">{userName}</p>
            <p className="text-[10px] text-[var(--steel-600)] mt-0.5 truncate">{userRole}</p>
          </div>
          <button
            onClick={() => handleSignOut()}
            title="Sair"
            className="p-1 text-[var(--steel-600)] hover:text-white transition-colors"
          >
            <LogOut size={13} />
          </button>
        </div>
      ) : (
        <div className="flex justify-center py-2.5 border-b border-white/[0.07]">
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  onClick={() => handleSignOut()}
                  className="w-7 h-7 flex items-center justify-center bg-[var(--copper-600)]/15 text-[var(--copper-600)] hover:bg-[var(--copper-600)]/25 transition-colors"
                />
              }
            >
              <span className="font-display font-bold text-[11px] leading-none">
                {getInitials(userName)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="right">{userName} — Sair</TooltipContent>
          </Tooltip>
        </div>
      )}

      <button
        onClick={onCollapse}
        title={collapsed ? "Expandir menu" : "Recolher menu"}
        className={cn(
          "w-full flex items-center py-2.5 px-3 text-[var(--steel-600)] hover:text-white transition-colors",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <span className="font-mono text-[10px] tracking-[0.08em] uppercase">Recolher</span>
        )}
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </div>
  )
}

/* Content shared by desktop and mobile renders */
function SidebarContent({
  collapsed,
  onCollapse,
  userName,
  userRole,
  visibleItems,
  pathname,
  onItemClick,
}: {
  collapsed: boolean
  onCollapse: () => void
  userName: string
  userRole: string
  visibleItems: typeof navItems
  pathname: string
  onItemClick?: () => void
}) {
  return (
    <>
      <Logo collapsed={collapsed} />
      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
        {visibleItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <NavItem
              key={item.href}
              href={item.href}
              title={item.title}
              active={active}
              collapsed={collapsed}
              onClick={onItemClick}
            />
          )
        })}
      </nav>
      <UserSection
        userName={userName}
        userRole={userRole}
        collapsed={collapsed}
        onCollapse={onCollapse}
      />
    </>
  )
}

export function Sidebar({
  userPermissions,
  userName,
  userRole,
  collapsed,
  mobileOpen,
  onCollapse,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname()

  const visibleItems = navItems.filter((item) =>
    can(userPermissions, item.module, "view")
  )

  const sharedProps = {
    onCollapse,
    userName,
    userRole,
    visibleItems,
    pathname,
  }

  return (
    <>
      {/* ── Desktop sidebar: static in flow, never fixed ── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-[#16181c] h-screen shrink-0 overflow-hidden transition-all duration-300",
          collapsed ? "w-16" : "w-[232px]"
        )}
      >
        <SidebarContent {...sharedProps} collapsed={collapsed} />
      </aside>

      {/* ── Mobile sidebar: fixed overlay, off-canvas when closed ── */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-[232px] flex flex-col bg-[#16181c] shadow-2xl transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent
          {...sharedProps}
          collapsed={false}
          onItemClick={onMobileClose}
        />
      </aside>
    </>
  )
}
