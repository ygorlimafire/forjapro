import { prisma } from "@/lib/prisma"

type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "RESTORE"
  | "PERMISSION_CHANGE"

interface AuditParams {
  userId: string
  action: AuditAction
  entity: string
  entityId?: string
  oldData?: unknown
  newData?: unknown
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(params: AuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        oldData: params.oldData ? JSON.parse(JSON.stringify(params.oldData)) : undefined,
        newData: params.newData ? JSON.parse(JSON.stringify(params.newData)) : undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    })
  } catch {
    // Não deixar falha no audit log quebrar a operação principal
  }
}
