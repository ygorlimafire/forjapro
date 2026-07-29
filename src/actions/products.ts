"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"
import { productSchema } from "@/lib/validations/product"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/types"
import { Prisma } from "@prisma/client"

export async function createProduct(formData: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }

  const parsed = productSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const existing = await prisma.product.findFirst({
      where: { sku: parsed.data.sku, deletedAt: null },
    })
    if (existing) return { success: false, error: "SKU já cadastrado" }

    const { technicalSpecs, ...rest } = parsed.data
    const product = await prisma.product.create({
      data: {
        ...rest,
        technicalSpecs: technicalSpecs as Prisma.InputJsonValue ?? Prisma.JsonNull,
      },
    })

    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entity: "Product",
      entityId: product.id,
      newData: product,
    })

    revalidatePath("/produtos")
    return { success: true, data: { id: product.id } }
  } catch {
    return { success: false, error: "Erro ao criar produto" }
  }
}

export async function updateProduct(
  id: string,
  formData: unknown
): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }

  const parsed = productSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const existing = await prisma.product.findFirst({
      where: { sku: parsed.data.sku, deletedAt: null, NOT: { id } },
    })
    if (existing) return { success: false, error: "SKU já cadastrado em outro produto" }

    const old = await prisma.product.findUnique({ where: { id } })
    const { technicalSpecs, ...rest } = parsed.data
    await prisma.product.update({
      where: { id },
      data: {
        ...rest,
        technicalSpecs: technicalSpecs as Prisma.InputJsonValue ?? Prisma.JsonNull,
      },
    })

    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entity: "Product",
      entityId: id,
      oldData: old,
      newData: parsed.data,
    })

    revalidatePath("/produtos")
    revalidatePath(`/produtos/${id}`)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Erro ao atualizar produto" }
  }
}

export async function toggleProductActive(id: string): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }

  try {
    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) return { success: false, error: "Produto não encontrado" }

    await prisma.product.update({
      where: { id },
      data: { isActive: !product.isActive },
    })

    revalidatePath("/produtos")
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Erro ao alterar status" }
  }
}

export async function deleteProduct(id: string): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }

  try {
    const old = await prisma.product.findUnique({ where: { id } })
    await prisma.product.update({ where: { id }, data: { deletedAt: new Date() } })

    await createAuditLog({
      userId: session.user.id,
      action: "DELETE",
      entity: "Product",
      entityId: id,
      oldData: old,
    })

    revalidatePath("/produtos")
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Erro ao excluir produto" }
  }
}

export async function getProducts(search?: string, categoryId?: string) {
  return prisma.product.findMany({
    where: {
      deletedAt: null,
      ...(categoryId ? { categoryId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { sku: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    include: { category: true },
  })
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id, deletedAt: null },
    include: { category: true, images: { orderBy: { order: "asc" } } },
  })
}

export async function getCategories() {
  return prisma.productCategory.findMany({ orderBy: { name: "asc" } })
}
