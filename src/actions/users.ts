"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { can } from "@/lib/rbac"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const createSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha mínima de 6 caracteres"),
  roleId: z.string().min(1, "Perfil obrigatório"),
})

const updateSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  roleId: z.string().min(1, "Perfil obrigatório"),
  isActive: z.boolean(),
  password: z.string().optional(),
})

export async function createUser(data: unknown) {
  const session = await auth()
  if (!session?.user || !can(session.user.permissions, "configuracoes", "create")) {
    return { success: false, error: "Sem permissão" }
  }

  const parsed = createSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: (JSON.parse(parsed.error.message) as { message: string }[])[0]?.message ?? "Dados inválidos" }

  const { name, email, password, roleId } = parsed.data

  const existing = await prisma.user.findFirst({ where: { email, deletedAt: null } })
  if (existing) return { success: false, error: "E-mail já cadastrado" }

  const hashedPassword = await bcrypt.hash(password, 12)
  await prisma.user.create({ data: { name, email, password: hashedPassword, roleId, isActive: true } })

  revalidatePath("/configuracoes")
  return { success: true }
}

export async function updateUser(id: string, data: unknown) {
  const session = await auth()
  if (!session?.user || !can(session.user.permissions, "configuracoes", "edit")) {
    return { success: false, error: "Sem permissão" }
  }

  const parsed = updateSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: (JSON.parse(parsed.error.message) as { message: string }[])[0]?.message ?? "Dados inválidos" }

  const { name, email, roleId, isActive, password } = parsed.data

  const conflict = await prisma.user.findFirst({ where: { email, deletedAt: null, NOT: { id } } })
  if (conflict) return { success: false, error: "E-mail já em uso por outro usuário" }

  const updateData: Record<string, unknown> = { name, email, roleId, isActive }
  if (password && password.length >= 6) {
    updateData.password = await bcrypt.hash(password, 12)
  }

  await prisma.user.update({ where: { id }, data: updateData })

  revalidatePath("/configuracoes")
  return { success: true }
}

export async function deleteUser(id: string) {
  const session = await auth()
  if (!session?.user || !can(session.user.permissions, "configuracoes", "delete")) {
    return { success: false, error: "Sem permissão" }
  }

  await prisma.user.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } })

  revalidatePath("/configuracoes")
  return { success: true }
}
