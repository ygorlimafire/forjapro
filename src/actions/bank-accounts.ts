"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { can } from "@/lib/rbac"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { ActionResult } from "@/types"
import type { BankAccountType } from "@prisma/client"

const bankAccountSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  type: z.enum(["CONTA_CORRENTE", "POUPANCA", "CAIXA"]),
  initialBalance: z.number().default(0),
})

export async function getBankAccounts() {
  return prisma.bankAccount.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  })
}

export async function getBankAccountsWithBalance() {
  const accounts = await prisma.bankAccount.findMany({
    where: { isActive: true },
    include: {
      receivables: { where: { status: "PAGO" }, select: { amount: true } },
      payables: { where: { status: "PAGO" }, select: { amount: true } },
    },
    orderBy: { name: "asc" },
  })

  return accounts.map((acc) => {
    const totalIn = acc.receivables.reduce((s, r) => s + Number(r.amount), 0)
    const totalOut = acc.payables.reduce((s, p) => s + Number(p.amount), 0)
    return {
      id: acc.id,
      name: acc.name,
      type: acc.type,
      initialBalance: Number(acc.initialBalance),
      currentBalance: Number(acc.initialBalance) + totalIn - totalOut,
      isActive: acc.isActive,
      createdAt: acc.createdAt,
    }
  })
}

export async function createBankAccount(data: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }
  if (!can(session.user.permissions, "financeiro", "edit")) {
    return { success: false, error: "Sem permissão" }
  }

  const parsed = bankAccountSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  try {
    const acc = await prisma.bankAccount.create({
      data: {
        name: parsed.data.name,
        type: parsed.data.type as BankAccountType,
        initialBalance: parsed.data.initialBalance,
      },
    })
    revalidatePath("/financeiro")
    return { success: true, data: { id: acc.id } }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export async function updateBankAccount(id: string, data: unknown): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }
  if (!can(session.user.permissions, "financeiro", "edit")) {
    return { success: false, error: "Sem permissão" }
  }

  const parsed = bankAccountSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  try {
    await prisma.bankAccount.update({
      where: { id },
      data: {
        name: parsed.data.name,
        type: parsed.data.type as BankAccountType,
        initialBalance: parsed.data.initialBalance,
      },
    })
    revalidatePath("/financeiro")
    return { success: true, data: undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export async function deactivateBankAccount(id: string): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }
  if (!can(session.user.permissions, "financeiro", "edit")) {
    return { success: false, error: "Sem permissão" }
  }

  try {
    await prisma.bankAccount.update({ where: { id }, data: { isActive: false } })
    revalidatePath("/financeiro")
    return { success: true, data: undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}
