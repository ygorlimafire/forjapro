export type { Customer, Contact, Product, ProductCategory, ProductImage,
  Lead, Opportunity, PipelineStage, Pipeline, Activity,
  User, Role, AuditLog } from "@prisma/client"

export interface NavItem {
  title: string
  href: string
  icon: string
  module: string
  children?: NavItem[]
}

export interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[]>>
}

export type ActionResult<T = void> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string }
