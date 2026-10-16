import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { company as fallback } from "@/config/company"

export const SETTINGS_CACHE_TAG = "company-settings"

export type LiveCompanySettings = {
  id: string
  name: string
  slogan: string | null
  logo: string | null
  primaryColor: string
  onboardingCompleted: boolean
  email: string | null
  phone: string | null
  cnpj: string | null
  website: string | null
  street: string | null
  number: string | null
  complement: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  bankInfo: Record<string, string> | null
  minMarginPct: number
}

export const getCompanySettings = unstable_cache(
  async (): Promise<LiveCompanySettings> => {
    const s = await prisma.companySettings.findFirst()
    if (!s) {
      return {
        id: "",
        name: fallback.name,
        slogan: fallback.slogan,
        logo: null,
        primaryColor: fallback.brandColor,
        onboardingCompleted: false,
        email: fallback.seed.companyEmail,
        phone: fallback.seed.companyPhone,
        cnpj: fallback.seed.companyCnpj,
        website: fallback.seed.companyWebsite,
        street: null,
        number: null,
        complement: null,
        neighborhood: null,
        city: null,
        state: null,
        zipCode: null,
        bankInfo: null,
        minMarginPct: 15,
      }
    }
    return {
      id: s.id,
      name: s.name,
      slogan: s.slogan ?? null,
      logo: s.logo ?? null,
      primaryColor: s.primaryColor ?? fallback.brandColor,
      onboardingCompleted: s.onboardingCompleted,
      email: s.email ?? null,
      phone: s.phone ?? null,
      cnpj: s.cnpj ?? null,
      website: s.website ?? null,
      street: s.street ?? null,
      number: s.number ?? null,
      complement: s.complement ?? null,
      neighborhood: s.neighborhood ?? null,
      city: s.city ?? null,
      state: s.state ?? null,
      zipCode: s.zipCode ?? null,
      bankInfo: s.bankInfo as Record<string, string> | null,
      minMarginPct: Number(s.minMarginPct),
    }
  },
  ["company-settings"],
  { tags: [SETTINGS_CACHE_TAG], revalidate: 3600 }
)
