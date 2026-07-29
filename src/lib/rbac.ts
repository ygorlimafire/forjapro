export const MODULES = {
  DASHBOARD: "dashboard",
  CRM: "crm",
  CLIENTES: "clientes",
  PROPOSTAS: "propostas",
  PEDIDOS: "pedidos",
  PRODUTOS: "produtos",
  ESTOQUE: "estoque",
  COMPRAS: "compras",
  FINANCEIRO: "financeiro",
  RELATORIOS: "relatorios",
  CONFIGURACOES: "configuracoes",
} as const

export const ACTIONS = {
  VIEW: "view",
  CREATE: "create",
  EDIT: "edit",
  DELETE: "delete",
  EXPORT: "export",
} as const

export const ROLES = {
  ADMIN: "ADMIN",
  GERENTE: "GERENTE",
  VENDEDOR: "VENDEDOR",
  FINANCEIRO: "FINANCEIRO",
  ESTOQUE: "ESTOQUE",
} as const

export function hasPermission(
  userPermissions: string[],
  module: string,
  action: string
): boolean {
  if (userPermissions.includes(`${MODULES.CONFIGURACOES}:${ACTIONS.VIEW}`)) {
    // admin tem acesso total — verificado pelo roleName no middleware
  }
  return userPermissions.includes(`${module}:${action}`)
}

export function can(permissions: string[], module: string, action: string) {
  return permissions.includes(`${module}:${action}`)
}

// Permissões padrão por papel
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: Object.values(MODULES).flatMap((m) =>
    Object.values(ACTIONS).map((a) => `${m}:${a}`)
  ),
  GERENTE: [
    "dashboard:view",
    "crm:view", "crm:create", "crm:edit", "crm:delete",
    "clientes:view", "clientes:create", "clientes:edit",
    "propostas:view", "propostas:create", "propostas:edit",
    "pedidos:view", "pedidos:create", "pedidos:edit",
    "produtos:view",
    "estoque:view",
    "compras:view",
    "financeiro:view",
    "relatorios:view", "relatorios:export",
    "configuracoes:view",
  ],
  VENDEDOR: [
    "dashboard:view",
    "crm:view", "crm:create", "crm:edit",
    "clientes:view", "clientes:create", "clientes:edit",
    "propostas:view", "propostas:create", "propostas:edit",
    "pedidos:view", "pedidos:create",
    "produtos:view",
  ],
  FINANCEIRO: [
    "dashboard:view",
    "clientes:view",
    "pedidos:view",
    "financeiro:view", "financeiro:create", "financeiro:edit",
    "relatorios:view", "relatorios:export",
  ],
  ESTOQUE: [
    "dashboard:view",
    "produtos:view", "produtos:create", "produtos:edit",
    "estoque:view", "estoque:create", "estoque:edit",
    "compras:view",
  ],
}
