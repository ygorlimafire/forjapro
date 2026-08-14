"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { updateOpportunity } from "@/actions/crm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Pencil, Loader2 } from "lucide-react"

const schema = z.object({
  title: z.string().min(2, "Título obrigatório"),
  assignedTo: z.string().optional(),
  value: z.number().optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedClose: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface OpportunityData {
  id: string
  title: string
  assignee?: { id: string; name: string } | null
  value?: number | null
  probability?: number | null
  expectedClose?: Date | null
}

interface Props {
  opportunity: OpportunityData
  users: { id: string; name: string }[]
  onSuccess: () => void
}

export function EditOpportunityDialog({ opportunity, users, onSuccess }: Props) {
  const [open, setOpen] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      title: opportunity.title,
      assignedTo: opportunity.assignee?.id ?? "",
      value: opportunity.value ?? undefined,
      probability: opportunity.probability ?? undefined,
      expectedClose: opportunity.expectedClose
        ? new Date(opportunity.expectedClose).toISOString().split("T")[0]
        : undefined,
    },
  })

  async function onSubmit(data: FormData) {
    const result = await updateOpportunity(opportunity.id, {
      ...data,
      expectedClose: data.expectedClose ? new Date(data.expectedClose) : undefined,
    })

    if (result.success) {
      toast.success("Oportunidade atualizada")
      setOpen(false)
      onSuccess()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Pencil size={14} />
            Editar
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Oportunidade</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input placeholder="Título da oportunidade" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Responsável</Label>
            <select
              className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              {...register("assignedTo")}
            >
              <option value="">Sem responsável</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Valor estimado (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                {...register("value", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Probabilidade (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="50"
                {...register("probability", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Previsão de fechamento</Label>
            <Input type="date" {...register("expectedClose")} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
