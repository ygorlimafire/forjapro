"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { can } from "@/lib/rbac"
import { createAuditLog } from "@/lib/audit"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { ActionResult } from "@/types"
import type { SupplierType } from "@prisma/client"

const supplierSchema = z.object({
  type: z.enum(["PRODUTO", "SERVICO", "DESPESA_FIXA", "OUTRO"]),
  companyName: z.string().min(1, "Razão social obrigatória"),
  tradeName: z.string().optional(),
  document: z.string().optional(),
  taxId: z.string().optional(),
  country: z.string().default("BR"),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  site: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  preferredPayment: z.enum(["PIX", "BOLETO", "TRANSFERENCIA", "CARTAO", "SWIFT", "CHEQUE"]).optional().or(z.literal("")).transform(v => v === "" ? undefined : v),
  currency: z.enum(["BRL", "USD", "EUR", "CNY", "GBP"]).default("BRL"),
  bank: z.string().optional(),
  bankAgency: z.string().optional(),
  bankAccount: z.string().optional(),
  bankIban: z.string().optional(),
  pixKey: z.string().optional(),
  avgLeadDays: z.coerce.number().int().min(0).optional().nullable(),
  avgPaymentDays: z.coerce.number().int().min(0).optional().nullable(),
  volumeDiscountPct: z.coerce.number().min(0).max(100).optional().nullable(),
  commercialTerms: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
})

export type SupplierFormData = z.infer<typeof supplierSchema>

export async function getSuppliersList(filters?: { type?: SupplierType; isActive?: boolean }) {
  return prisma.supplier.findMany({
    where: {
      ...(filters?.type ? { type: filters.type } : {}),
      ...(filters?.isActive !== undefined ? { isActive: filters.isActive } : {}),
    },
    orderBy: [{ isActive: "desc" }, { tradeName: "asc" }, { companyName: "asc" }],
  })
}

export async function getSupplierById(id: string) {
  return prisma.supplier.findUnique({ where: { id } })
}

export async function createSupplier(data: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session?.user || !can(session.user.permissions, "compras", "create")) {
    return { success: false, error: "Sem permissão" }
  }

  const parsed = supplierSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" }

  const supplier = await prisma.supplier.create({
    data: {
      ...parsed.data,
      email: parsed.data.email || null,
      preferredPayment: parsed.data.preferredPayment ?? null,
      volumeDiscountPct: parsed.data.volumeDiscountPct ?? null,
      avgLeadDays: parsed.data.avgLeadDays ?? null,
      avgPaymentDays: parsed.data.avgPaymentDays ?? null,
    },
  })

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entity: "Supplier",
    entityId: supplier.id,
    newData: parsed.data,
  })

  revalidatePath("/fornecedores")
  return { success: true, data: { id: supplier.id } }
}

export async function updateSupplier(id: string, data: unknown): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user || !can(session.user.permissions, "compras", "edit")) {
    return { success: false, error: "Sem permissão" }
  }

  const parsed = supplierSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" }

  const old = await prisma.supplier.findUnique({ where: { id } })

  await prisma.supplier.update({
    where: { id },
    data: {
      ...parsed.data,
      email: parsed.data.email || null,
      preferredPayment: parsed.data.preferredPayment ?? null,
      volumeDiscountPct: parsed.data.volumeDiscountPct ?? null,
      avgLeadDays: parsed.data.avgLeadDays ?? null,
      avgPaymentDays: parsed.data.avgPaymentDays ?? null,
    },
  })

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entity: "Supplier",
    entityId: id,
    oldData: old,
    newData: parsed.data,
  })

  revalidatePath("/fornecedores")
  revalidatePath(`/fornecedores/${id}`)
  return { success: true, data: undefined }
}

export async function deactivateSupplier(id: string): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user || !can(session.user.permissions, "compras", "edit")) {
    return { success: false, error: "Sem permissão" }
  }

  await prisma.supplier.update({ where: { id }, data: { isActive: false } })
  revalidatePath("/fornecedores")
  return { success: true, data: undefined }
}
