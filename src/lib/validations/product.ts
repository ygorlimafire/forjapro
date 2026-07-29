import { z } from "zod"

export const productSchema = z.object({
  sku: z.string().min(1, "SKU obrigatório").max(50),
  name: z.string().min(2, "Nome obrigatório"),
  categoryId: z.string().min(1, "Categoria obrigatória"),
  description: z.string().optional(),
  technicalSpecs: z.record(z.string(), z.string()).optional(),
  mainImage: z.string().url("URL inválida").optional().or(z.literal("")),
  listPrice: z.number().min(0.01, "Preço deve ser maior que zero"),
  costPrice: z.number().min(0, "Custo não pode ser negativo"),
  desiredMargin: z.number().min(0).max(100).optional(),
  warranty: z.string().optional(),
  isActive: z.boolean(),
})

export type ProductFormData = z.infer<typeof productSchema>
