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
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { getInitials } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SidebarProps {
  userPermissions: string[]
  userName: string
  userRole: string
}

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, module: "dashboard" },
  { title: "CRM", href: "/crm", icon: Target, module: "crm" },
  { title: "Clientes", href: "/clientes", icon: Users, module: "clientes" },
  { title: "Propostas", href: "/propostas", icon: FileText, module: "propostas" },
  { title: "Pedidos", href: "/pedidos", icon: ShoppingCart, module: "pedidos" },
  { title: "Produtos", href: "/produtos", icon: Package, module: "produtos" },
  { title: "Estoque", href: "/estoque", icon: Warehouse, module: "estoque" },
  { title: "Compras", href: "/compras", icon: TrendingUp, module: "compras" },
  { title: "Fornecedores", href: "/fornecedores", icon: Truck, module: "compras" },
  { title: "Financeiro", href: "/financeiro", icon: DollarSign, module: "financeiro" },
  { title: "Relatórios", href: "/relatorios", icon: BarChart3, module: "relatorios" },
  { title: "Configurações", href: "/configuracoes", icon: Settings, module: "configuracoes" },
]

export function Sidebar({ userPermissions, userName, userRole }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const visibleItems = navItems.filter((item) =>
    can(userPermissions, item.module, "view")
  )

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 shrink-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
        <div className="w-8 h-8 rounded bg-sidebar-primary flex items-center justify-center shrink-0">
          <span className="text-sidebar-primary-foreground font-bold text-sm">F</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-bold text-sm tracking-wider leading-none">FORJA PRO</p>
            <p className="text-[10px] text-sidebar-foreground/40 tracking-widest uppercase">Gestão Comercial</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + "/")

          const linkEl = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon
                size={18}
                className={cn("shrink-0", active && "text-sidebar-primary")}
              />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          )

          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger render={<span />}>{linkEl}</TooltipTrigger>
                <TooltipContent side="right">{item.title}</TooltipContent>
              </Tooltip>
            )
          }

          return linkEl
        })}
      </nav>

      {/* User + collapse */}
      <div className="border-t border-sidebar-border p-3 space-y-2 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-7 h-7 rounded-full bg-sidebar-primary/20 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-semibold text-sidebar-primary">
                {getInitials(userName)}
              </span>
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-medium leading-none truncate">{userName}</p>
              <p className="text-[11px] text-sidebar-foreground/40 mt-0.5">{userRole}</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
            collapsed ? "justify-center px-2" : "justify-start"
          )}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span className="text-xs">Recolher</span>}
        </Button>
      </div>
    </aside>
  )
}
