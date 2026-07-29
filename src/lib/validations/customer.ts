import { z } from "zod"

export const contactSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Nome obrigatório"),
  role: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  isPrimary: z.boolean(),
})

export const customerSchema = z.object({
  type: z.enum(["PJ", "PF"]),
  companyName: z.string().optional(),
  tradeName: z.string().optional(),
  document: z.string().min(11, "Documento inválido").max(18),
  stateRegistration: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  zipCode: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  notes: z.string().optional(),
  contacts: z.array(contactSchema),
})

export type CustomerFormData = z.infer<typeof customerSchema>
