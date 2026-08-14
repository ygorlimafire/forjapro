"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { ActionResult } from "@/types"

// ── Leads ──────────────────────────────────────────────────────────────────────

const leadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.enum(["INDICACAO","SITE","INSTAGRAM","GOOGLE","FEIRA","LIGACAO","EMAIL","OUTRO"]).optional(),
  status: z.enum(["NOVO","CONTATO","QUALIFICADO","CONVERTIDO","DESCARTADO"]).default("NOVO"),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
})

export async function createLead(formData: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }

  const parsed = leadSchema.safeParse(formData)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  try {
    const lead = await prisma.lead.create({ data: parsed.data })
    await createAuditLog({ userId: session.user.id, action: "CREATE", entity: "Lead", entityId: lead.id })
    revalidatePath("/crm")
    return { success: true, data: { id: lead.id } }
  } catch {
    return { success: false, error: "Erro ao criar lead" }
  }
}

export async function updateLead(id: string, formData: unknown): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }

  const parsed = leadSchema.safeParse(formData)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  try {
    await prisma.lead.update({ where: { id }, data: parsed.data })
    revalidatePath("/crm")
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Erro ao atualizar lead" }
  }
}

// ── Opportunities ──────────────────────────────────────────────────────────────

const opportunitySchema = z.object({
  title: z.string().min(2),
  customerId: z.string().min(1),
  stageId: z.string().min(1),
  assignedTo: z.string().optional(),
  value: z.number().optional(),
  expectedClose: z.coerce.date().optional(),
  probability: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
})

export async function createOpportunity(formData: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }

  const parsed = opportunitySchema.safeParse(formData)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  try {
    const opp = await prisma.opportunity.create({ data: parsed.data })

    await prisma.opportunityStageHistory.create({
      data: {
        opportunityId: opp.id,
        toStageId: opp.stageId,
        userId: session.user.id,
        notes: "Oportunidade criada",
      },
    })

    revalidatePath("/crm")
    return { success: true, data: { id: opp.id } }
  } catch {
    return { success: false, error: "Erro ao criar oportunidade" }
  }
}

export async function moveOpportunityStage(
  opportunityId: string,
  newStageId: string,
  notes?: string
): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }

  try {
    const opp = await prisma.opportunity.findUnique({ where: { id: opportunityId } })
    if (!opp) return { success: false, error: "Oportunidade não encontrada" }

    await prisma.$transaction([
      prisma.opportunity.update({
        where: { id: opportunityId },
        data: { stageId: newStageId },
      }),
      prisma.opportunityStageHistory.create({
        data: {
          opportunityId,
          fromStageId: opp.stageId,
          toStageId: newStageId,
          userId: session.user.id,
          notes,
        },
      }),
    ])

    revalidatePath("/crm")
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Erro ao mover oportunidade" }
  }
}

// ── Activities ─────────────────────────────────────────────────────────────────

const activitySchema = z.object({
  type: z.enum(["LIGACAO","EMAIL","REUNIAO","VISITA","WHATSAPP","TAREFA","NOTA"]),
  title: z.string().min(2),
  description: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  leadId: z.string().optional(),
  opportunityId: z.string().optional(),
})

export async function createActivity(formData: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }

  const parsed = activitySchema.safeParse(formData)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  try {
    const activity = await prisma.activity.create({
      data: { ...parsed.data, userId: session.user.id },
    })
    revalidatePath("/crm")
    return { success: true, data: { id: activity.id } }
  } catch {
    return { success: false, error: "Erro ao criar atividade" }
  }
}

// ── Queries ────────────────────────────────────────────────────────────────────

export async function getKanbanData() {
  const pipeline = await prisma.pipeline.findFirst({
    where: { isActive: true },
    include: {
      stages: {
        orderBy: { order: "asc" },
        include: {
          opportunities: {
            where: { deletedAt: null },
            orderBy: { updatedAt: "desc" },
            include: {
              customer: { select: { companyName: true, tradeName: true } },
              assignee: { select: { name: true } },
            },
          },
        },
      },
    },
  })
  return pipeline
}

export async function getOpportunityDetail(id: string) {
  return prisma.opportunity.findUnique({
    where: { id },
    include: {
      stage: { select: { name: true, color: true } },
      customer: {
        select: {
          id: true,
          companyName: true,
          tradeName: true,
          phone: true,
          email: true,
          contacts: {
            where: { deletedAt: null },
            select: { name: true, role: true, phone: true, email: true, isPrimary: true },
            orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
          },
        },
      },
      assignee: { select: { id: true, name: true } },
      activities: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      },
      proposals: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          number: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          order: { select: { id: true, status: true } },
        },
      },
    },
  })
}

const updateOpportunitySchema = z.object({
  title: z.string().min(2, "Título obrigatório"),
  assignedTo: z.string().optional(),
  value: z.number().optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedClose: z.coerce.date().optional(),
})

export async function updateOpportunity(id: string, formData: unknown): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }

  const parsed = updateOpportunitySchema.safeParse(formData)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  try {
    await prisma.opportunity.update({
      where: { id },
      data: {
        ...parsed.data,
        assignedTo: parsed.data.assignedTo || null,
      },
    })
    await createAuditLog({ userId: session.user.id, action: "UPDATE", entity: "Opportunity", entityId: id })
    revalidatePath("/crm")
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Erro ao atualizar oportunidade" }
  }
}

export async function updateOpportunityNotes(id: string, notes: string): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Não autorizado" }

  try {
    await prisma.opportunity.update({ where: { id }, data: { notes } })
    revalidatePath("/crm")
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Erro ao salvar observações" }
  }
}

export async function getUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })
}

export async function getLeads(search?: string) {
  return prisma.lead.findMany({
    where: {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { company: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { assignee: { select: { name: true } } },
  })
}
