"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createOpportunity } from "@/actions/crm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Loader2 } from "lucide-react"

const schema = z.object({
  title: z.string().min(2, "Título obrigatório"),
  customerId: z.string().min(1, "Selecione um cliente"),
  stageId: z.string().min(1, "Selecione uma etapa"),
  value: z.number().optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedClose: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  stages: { id: string; name: string }[]
  customers: { id: string; name: string }[]
}

export function NewOpportunityDialog({ stages, customers }: Props) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
  })

  async function onSubmit(data: FormData) {
    const result = await createOpportunity({
      ...data,
      expectedClose: data.expectedClose ? new Date(data.expectedClose) : undefined,
    })

    if (result.success) {
      toast.success("Oportunidade criada")
      reset()
      setOpen(false)
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus size={16} />
            Nova oportunidade
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Oportunidade</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input placeholder="Ex: Equipamento para restaurante XYZ" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Cliente *</Label>
            <select
              className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              {...register("customerId")}
            >
              <option value="">Selecione o cliente...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.customerId && <p className="text-xs text-destructive">{errors.customerId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Etapa do funil *</Label>
            <select
              className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              {...register("stageId")}
            >
              <option value="">Selecione a etapa...</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Valor estimado (R$)</Label>
              <Input type="number" step="0.01" min="0" placeholder="0,00" {...register("value", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Probabilidade (%)</Label>
              <Input type="number" min="0" max="100" placeholder="50" {...register("probability", { valueAsNumber: true })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Previsão de fechamento</Label>
            <Input type="date" {...register("expectedClose")} />
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea placeholder="Contexto, requisitos..." rows={2} {...register("notes")} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isSubmitting ? "Criando..." : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
