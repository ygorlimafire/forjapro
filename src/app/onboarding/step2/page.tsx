import { getCompanySettings } from "@/lib/company-settings"
import { ColorForm } from "./color-form"

export default async function OnboardingStep2() {
  const s = await getCompanySettings()

  const savedFields: Record<string, string> = {
    name: s.name,
    slogan: s.slogan ?? "",
    logo: s.logo ?? "",
    email: s.email ?? "",
    phone: s.phone ?? "",
    cnpj: s.cnpj ?? "",
    website: s.website ?? "",
    street: s.street ?? "",
    number: s.number ?? "",
    complement: s.complement ?? "",
    neighborhood: s.neighborhood ?? "",
    city: s.city ?? "",
    state: s.state ?? "",
    zipCode: s.zipCode ?? "",
    primaryColor: s.primaryColor,
  }

  return <ColorForm initialColor={s.primaryColor} savedFields={savedFields} />
}
