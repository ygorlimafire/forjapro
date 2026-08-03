import { z } from "zod"

export const stockEntrySchema = z.object({
  productId: z.string().min(1, "Produto obrigatório"),
  warehouseId: z.string().min(1, "Local obrigatório"),
  quantity: z.number().int().positive("Quantidade deve ser maior que zero"),
  unitCost: z.number().min(0, "Custo não pode ser negativo").optional(),
  serialNumbers: z.array(z.string().min(1)).optional(),
  notes: z.string().optional(),
})

export const stockAdjustSchema = z.object({
  productId: z.string().min(1, "Produto obrigatório"),
  warehouseId: z.string().min(1, "Local obrigatório"),
  type: z.enum(["AJUSTE", "PERDA", "DEVOLUCAO"]),
  quantity: z.number().int().refine((v) => v !== 0, "Quantidade não pode ser zero"),
  reason: z.string().min(10, "Justificativa deve ter no mínimo 10 caracteres"),
  serialNumber: z.string().optional(),
})

export type StockEntryData = z.infer<typeof stockEntrySchema>
export type StockAdjustData = z.infer<typeof stockAdjustSchema>
