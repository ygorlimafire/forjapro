import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LayoutShell } from "@/components/layout/layout-shell"
import { TooltipProvider } from "@/components/ui/tooltip"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <TooltipProvider>
      <LayoutShell
        userPermissions={session.user.permissions}
        userName={session.user.name}
        userEmail={session.user.email}
        userRole={session.user.roleName}
      >
        {children}
      </LayoutShell>
    </TooltipProvider>
  )
}
