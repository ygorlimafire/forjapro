"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { createUser, updateUser } from "@/actions/users"

type Role = { id: string; label: string }
type UserData = { id: string; name: string; email: string; roleId: string; isActive: boolean }

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: UserData | null
  roles: Role[]
}

export function UserDialog({ open, onOpenChange, user, roles }: Props) {
  const router = useRouter()
  const isEdit = !!user

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [roleId, setRoleId] = useState(roles[0]?.id ?? "")
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setRoleId(user.roleId)
      setIsActive(user.isActive)
      setPassword("")
    } else {
      setName("")
      setEmail("")
      setPassword("")
      setRoleId(roles[0]?.id ?? "")
      setIsActive(true)
    }
  }, [open, user, roles])

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || !roleId) {
      toast.error("Preencha nome, e-mail e perfil")
      return
    }
    if (!isEdit && password.length < 6) {
      toast.error("Senha deve ter pelo menos 6 caracteres")
      return
    }

    setLoading(true)
    try {
      const result = isEdit
        ? await updateUser(user!.id, { name, email, roleId, isActive, password: password || undefined })
        : await createUser({ name, email, password, roleId })

      if (!result.success) {
        toast.error(result.error)
      } else {
        toast.success(isEdit ? "Usuário atualizado!" : "Usuário criado!")
        onOpenChange(false)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar usuário" : "Novo usuário"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Altere os dados do usuário." : "Preencha os dados para criar um novo acesso."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="u-name">Nome *</Label>
            <Input id="u-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="u-email">E-mail *</Label>
            <Input id="u-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@empresa.com" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="u-role">Perfil de acesso *</Label>
            <select
              id="u-role"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="u-password">
              {isEdit ? "Nova senha (deixe em branco para manter)" : "Senha *"}
            </Label>
            <Input
              id="u-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? "Opcional — mínimo 6 caracteres" : "Mínimo 6 caracteres"}
            />
          </div>

          {isEdit && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={() => setIsActive((v) => !v)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isActive ? "bg-primary" : "bg-input"}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-4" : "translate-x-0.5"}`}
                />
              </button>
              <Label
                className="text-sm font-normal cursor-pointer"
                onClick={() => setIsActive((v) => !v)}
              >
                Usuário ativo
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? "Salvar" : "Criar usuário"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
