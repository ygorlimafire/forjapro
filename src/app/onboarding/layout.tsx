import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getCompanySettings } from "@/lib/company-settings"

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const settings = await getCompanySettings()
  if (settings.onboardingCompleted) redirect("/dashboard")

  return (
    <div className="min-h-screen bg-[#f5f6f7] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl">
        {children}
      </div>
    </div>
  )
}
