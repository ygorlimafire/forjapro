"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { LogOut, User, Menu } from "lucide-react"
import { getInitials } from "@/lib/utils"
import { handleSignOut } from "@/actions/auth"

interface HeaderProps {
  userName: string
  userEmail: string
  userRole: string
  onMenuToggle: () => void
}

export function Header({ userName, userEmail, userRole, onMenuToggle }: HeaderProps) {
  return (
    <header className="h-12 border-b border-[--border-200] bg-white flex items-center justify-between px-4 flex-shrink-0">
      {/* Hamburger — visible on mobile only */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-1.5 text-[--steel-600] hover:text-[--ink-900] transition-colors"
        aria-label="Menu"
      >
        <Menu size={18} />
      </button>
      <div className="hidden lg:block" />

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="sm" className="gap-2 h-8 px-2" />}
        >
          <div className="w-6 h-6 bg-[--copper-600]/10 flex items-center justify-center flex-shrink-0">
            <span className="font-display font-bold text-[10px] text-[--copper-600] leading-none">
              {getInitials(userName)}
            </span>
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-[11px] font-semibold leading-none text-[--ink-900]">{userName}</p>
            <p className="text-[10px] text-[--steel-600] mt-0.5">{userRole}</p>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>
            <p className="font-semibold text-sm">{userName}</p>
            <p className="text-xs text-[--steel-600] font-normal">{userEmail}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User size={13} />
            Meu perfil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={() => handleSignOut()}>
            <LogOut size={13} />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
