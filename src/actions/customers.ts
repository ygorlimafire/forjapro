"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { can } from "@/lib/rbac"
import { createAuditLog } from "@/lib/audit"
import { customerSchema } from "@/lib/validations/customer"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/types"

export async function createCustomer(formData: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }

  const parsed = customerSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { contacts, ...customerData } = parsed.data

  try {
    const existing = await prisma.customer.findFirst({
      where: { document: customerData.document, deletedAt: null },
    })
    if (existing) {
      return { success: false, error: "CNPJ/CPF já cadastrado" }
    }

    const customer = await prisma.customer.create({
      data: {
        ...customerData,
        contacts: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          create: contacts.map(({ id: _omitId, ...c }) => c),
        },
      },
    })

    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entity: "Customer",
      entityId: customer.id,
      newData: customer,
    })

    revalidatePath("/clientes")
    return { success: true, data: { id: customer.id } }
  } catch {
    return { success: false, error: "Erro ao criar cliente" }
  }
}

export async function updateCustomer(
  id: string,
  formData: unknown
): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }

  const parsed = customerSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { contacts, ...customerData } = parsed.data

  try {
    const existing = await prisma.customer.findFirst({
      where: { document: customerData.document, deletedAt: null, NOT: { id } },
    })
    if (existing) {
      return { success: false, error: "CNPJ/CPF já cadastrado em outro cliente" }
    }

    const old = await prisma.customer.findUnique({ where: { id } })

    await prisma.$transaction(async (tx) => {
      await tx.customer.update({ where: { id }, data: customerData })

      const existingContacts = await tx.contact.findMany({
        where: { customerId: id, deletedAt: null },
      })
      const incomingIds = contacts.filter((c) => c.id).map((c) => c.id!)
      const toDelete = existingContacts.filter((c) => !incomingIds.includes(c.id))

      if (toDelete.length > 0) {
        await tx.contact.updateMany({
          where: { id: { in: toDelete.map((c) => c.id) } },
          data: { deletedAt: new Date() },
        })
      }

      for (const contact of contacts) {
        const { id: cId, ...cData } = contact
        if (cId) {
          await tx.contact.update({ where: { id: cId }, data: cData })
        } else {
          await tx.contact.create({ data: { ...cData, customerId: id } })
        }
      }
    })

    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entity: "Customer",
      entityId: id,
      oldData: old,
      newData: customerData,
    })

    revalidatePath("/clientes")
    revalidatePath(`/clientes/${id}`)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Erro ao atualizar cliente" }
  }
}

export async function deleteCustomer(id: string): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }
  if (!can(session.user.permissions, "clientes", "delete")) return { success: false, error: "Sem permissão" }

  try {
    const old = await prisma.customer.findUnique({ where: { id } })
    await prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    await createAuditLog({
      userId: session.user.id,
      action: "DELETE",
      entity: "Customer",
      entityId: id,
      oldData: old,
    })

    revalidatePath("/clientes")
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Erro ao excluir cliente" }
  }
}

export async function getCustomers(search?: string) {
  return prisma.customer.findMany({
    where: {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { companyName: { contains: search, mode: "insensitive" } },
              { tradeName: { contains: search, mode: "insensitive" } },
              { document: { contains: search } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { contacts: true, opportunities: true } },
    },
  })
}

export async function getCustomerById(id: string) {
  return prisma.customer.findUnique({
    where: { id, deletedAt: null },
    include: {
      contacts: { where: { deletedAt: null }, orderBy: { isPrimary: "desc" } },
      opportunities: {
        where: { deletedAt: null },
        include: { stage: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  })
}
