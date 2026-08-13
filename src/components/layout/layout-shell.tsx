"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

interface LayoutShellProps {
  userPermissions: string[]
  userName: string
  userEmail: string
  userRole: string
  children: React.ReactNode
}

export function LayoutShell({
  userPermissions,
  userName,
  userEmail,
  userRole,
  children,
}: LayoutShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[--ink-900]/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        userPermissions={userPermissions}
        userName={userName}
        userRole={userRole}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCollapse={() => setCollapsed((c) => !c)}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          onMenuToggle={() => setMobileOpen((o) => !o)}
        />
        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </div>
    </div>
  )
}
