"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { createActivity } from "@/actions/crm"
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
  type: z.enum(["LIGACAO", "EMAIL", "REUNIAO", "VISITA", "WHATSAPP", "TAREFA", "NOTA"]),
  title: z.string().min(2, "Título obrigatório"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const activityTypeOptions = [
  { value: "LIGACAO", label: "Ligação" },
  { value: "EMAIL", label: "E-mail" },
  { value: "REUNIAO", label: "Reunião" },
  { value: "VISITA", label: "Visita" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "TAREFA", label: "Tarefa" },
  { value: "NOTA", label: "Nota" },
]

interface Props {
  opportunityId: string
  onSuccess: () => void
}

export function AddActivityDialog({ opportunityId, onSuccess }: Props) {
  const [open, setOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { type: "LIGACAO" },
  })

  async function onSubmit(data: FormData) {
    const result = await createActivity({
      ...data,
      opportunityId,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    })

    if (result.success) {
      toast.success("Atividade registrada")
      reset()
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
            <Plus size={14} />
            Nova atividade
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nova Atividade</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <select
              className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              {...register("type")}
            >
              {activityTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Título *</Label>
            <Input placeholder="Ex: Ligação de follow-up" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea placeholder="Detalhes da atividade..." rows={2} {...register("description")} />
          </div>

          <div className="space-y-2">
            <Label>Data prevista</Label>
            <Input type="datetime-local" {...register("dueDate")} />
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
