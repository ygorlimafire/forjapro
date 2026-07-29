import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
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
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          userPermissions={session.user.permissions}
          userName={session.user.name}
          userRole={session.user.roleName}
        />
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <Header
            userName={session.user.name}
            userEmail={session.user.email}
            userRole={session.user.roleName}
          />
          <main className="flex-1 overflow-y-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
