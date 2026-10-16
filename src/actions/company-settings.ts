"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidateTag } from "next/cache"
import { SETTINGS_CACHE_TAG } from "@/lib/company-settings"
import { can } from "@/lib/rbac"
import { z } from "zod"
import type { ActionResult } from "@/types"

const brandingSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  slogan: z.string().optional(),
  logo: z.string().url().optional().or(z.literal("")).or(z.null()),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida (ex: #b5652f)"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  cnpj: z.string().optional(),
  website: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  minMarginPct: z.coerce.number().min(0).max(100).optional(),
})

export async function saveCompanyBranding(data: unknown): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }
  if (!can(session.user.permissions, "configuracoes", "edit")) {
    return { success: false, error: "Sem permissão" }
  }

  const parsed = brandingSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const existing = await prisma.companySettings.findFirst()

  const payload = {
    name: parsed.data.name,
    slogan: parsed.data.slogan || null,
    logo: parsed.data.logo || null,
    primaryColor: parsed.data.primaryColor,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    cnpj: parsed.data.cnpj || null,
    website: parsed.data.website || null,
    street: parsed.data.street || null,
    number: parsed.data.number || null,
    complement: parsed.data.complement || null,
    neighborhood: parsed.data.neighborhood || null,
    city: parsed.data.city || null,
    state: parsed.data.state || null,
    zipCode: parsed.data.zipCode || null,
    ...(parsed.data.minMarginPct !== undefined && { minMarginPct: parsed.data.minMarginPct }),
  }

  try {
    if (existing) {
      await prisma.companySettings.update({ where: { id: existing.id }, data: payload })
    } else {
      await prisma.companySettings.create({ data: { ...payload, onboardingCompleted: false } })
    }
    revalidateTag(SETTINGS_CACHE_TAG, {})
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function completeOnboarding(): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }

  const existing = await prisma.companySettings.findFirst()
  if (!existing) return { success: false, error: "Configurações não encontradas" }

  try {
    await prisma.companySettings.update({
      where: { id: existing.id },
      data: { onboardingCompleted: true },
    })
    revalidateTag(SETTINGS_CACHE_TAG, {})
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function saveBankInfo(data: Record<string, string>): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }
  if (!can(session.user.permissions, "configuracoes", "edit")) {
    return { success: false, error: "Sem permissão" }
  }

  const existing = await prisma.companySettings.findFirst()
  if (!existing) return { success: false, error: "Configurações não encontradas" }

  try {
    await prisma.companySettings.update({ where: { id: existing.id }, data: { bankInfo: data } })
    revalidateTag(SETTINGS_CACHE_TAG, {})
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}
