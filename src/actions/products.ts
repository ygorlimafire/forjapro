"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"
import { productSchema, productCategorySchema } from "@/lib/validations/product"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/types"
import { Prisma } from "@prisma/client"
import { can } from "@/lib/rbac"

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

export async function addProductImage(
  productId: string,
  url: string,
  alt?: string
): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }

  try {
    const count = await prisma.productImage.count({ where: { productId } })
    const image = await prisma.productImage.create({
      data: { productId, url, alt: alt ?? null, order: count },
    })

    revalidatePath(`/produtos/${productId}`)
    return { success: true, data: { id: image.id } }
  } catch {
    return { success: false, error: "Erro ao adicionar imagem" }
  }
}

export async function removeProductImage(imageId: string): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }

  try {
    const image = await prisma.productImage.findUnique({ where: { id: imageId } })
    if (!image) return { success: false, error: "Imagem não encontrada" }

    await prisma.productImage.delete({ where: { id: imageId } })
    revalidatePath(`/produtos/${image.productId}`)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Erro ao remover imagem" }
  }
}

export async function reorderProductImage(
  imageId: string,
  newOrder: number
): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }

  try {
    await prisma.productImage.update({
      where: { id: imageId },
      data: { order: newOrder },
    })
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Erro ao reordenar imagem" }
  }
}

export async function getProducts(search?: string, categoryId?: string) {
  return prisma.product.findMany({
    where: {
      deletedAt: null,
      isActive: true,
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
  return prisma.productCategory.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  })
}

export async function getAllCategories() {
  return prisma.productCategory.findMany({
    orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: { where: { deletedAt: null } } } } },
  })
}

export async function createProductCategory(formData: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session?.user || !can(session.user.permissions, "produtos", "create")) {
    return { success: false, error: "Sem permissão" }
  }

  const parsed = productCategorySchema.safeParse(formData)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  try {
    const exists = await prisma.productCategory.findFirst({ where: { name: parsed.data.name } })
    if (exists) return { success: false, error: "Já existe uma categoria com esse nome" }

    const maxOrder = await prisma.productCategory.aggregate({ _max: { sortOrder: true } })
    const cat = await prisma.productCategory.create({
      data: {
        ...parsed.data,
        sortOrder: parsed.data.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
        isActive: true,
      },
    })
    revalidatePath("/produtos")
    revalidatePath("/configuracoes")
    return { success: true, data: { id: cat.id } }
  } catch {
    return { success: false, error: "Erro ao criar categoria" }
  }
}

export async function updateProductCategory(id: string, formData: unknown): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user || !can(session.user.permissions, "produtos", "edit")) {
    return { success: false, error: "Sem permissão" }
  }

  const parsed = productCategorySchema.safeParse(formData)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  try {
    const conflict = await prisma.productCategory.findFirst({
      where: { name: parsed.data.name, NOT: { id } },
    })
    if (conflict) return { success: false, error: "Já existe outra categoria com esse nome" }

    await prisma.productCategory.update({ where: { id }, data: parsed.data })
    revalidatePath("/produtos")
    revalidatePath("/configuracoes")
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Erro ao atualizar categoria" }
  }
}

export async function toggleProductCategory(id: string, active: boolean): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user || !can(session.user.permissions, "produtos", "edit")) {
    return { success: false, error: "Sem permissão" }
  }

  try {
    if (!active) {
      const count = await prisma.product.count({ where: { categoryId: id, deletedAt: null } })
      if (count > 0) {
        await prisma.productCategory.update({ where: { id }, data: { isActive: false } })
        revalidatePath("/configuracoes")
        return { success: true, data: undefined }
      }
    }
    await prisma.productCategory.update({ where: { id }, data: { isActive: active } })
    revalidatePath("/produtos")
    revalidatePath("/configuracoes")
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Erro ao alterar categoria" }
  }
}

export async function reorderProductCategories(orderedIds: string[]): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user || !can(session.user.permissions, "produtos", "edit")) {
    return { success: false, error: "Sem permissão" }
  }

  try {
    await prisma.$transaction(
      orderedIds.map((id, idx) =>
        prisma.productCategory.update({ where: { id }, data: { sortOrder: idx + 1 } })
      )
    )
    revalidatePath("/produtos")
    revalidatePath("/configuracoes")
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Erro ao reordenar categorias" }
  }
}
