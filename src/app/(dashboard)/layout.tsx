import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LayoutShell } from "@/components/layout/layout-shell"
import { TooltipProvider } from "@/components/ui/tooltip"
import { getCompanySettings } from "@/lib/company-settings"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const settings = await getCompanySettings()
  if (session.user.roleName === "ADMIN" && !settings.onboardingCompleted) {
    redirect("/onboarding")
  }

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
