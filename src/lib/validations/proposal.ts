import { z } from "zod"

export const proposalItemSchema = z.object({
  productId: z.string().min(1, "Produto obrigatório"),
  position: z.number().int(),
  productName: z.string(),
  productSku: z.string(),
  productImage: z.string().optional(),
  productDescription: z.string().optional(),
  technicalSpecs: z.record(z.string(), z.string()).optional(),
  listPrice: z.number().min(0.01, "Preço de tabela inválido"),
  costPrice: z.number().min(0),
  ipiPct: z.number().min(0).max(100),
  discountPct: z.number().min(0).max(100),
  netPrice: z.number().min(0),
  quantity: z.number().int().min(1, "Quantidade mínima é 1"),
  subtotal: z.number().min(0),
  estimatedMargin: z.number().optional(),
  estimatedMarginPct: z.number().optional(),
})

export const proposalSchema = z.object({
  customerId: z.string().min(1, "Cliente obrigatório"),
  opportunityId: z.string().optional(),
  nature: z.string().min(1),
  validityDays: z.number().int().min(1).max(365),
  paymentCondition: z.string().optional(),
  installments: z.number().int().min(1).max(60).optional(),
  installmentDueDates: z.array(z.string()).optional(),
  freight: z.number().min(0),
  notes: z.string().optional(),
  additionalInfo: z.string().optional(),
  items: z.array(proposalItemSchema).min(1, "Adicione pelo menos um produto"),
})

export const quickCustomerSchema = z.object({
  type: z.enum(["PJ", "PF"]),
  companyName: z.string().optional(),
  tradeName: z.string().optional(),
  document: z.string().min(11, "Documento inválido"),
  phone: z.string().optional(),
  email: z.string().email({ message: "E-mail inválido" }).optional().or(z.literal("")),
})

export type ProposalFormData = z.infer<typeof proposalSchema>
export type ProposalItemData = z.infer<typeof proposalItemSchema>
export type QuickCustomerData = z.infer<typeof quickCustomerSchema>
