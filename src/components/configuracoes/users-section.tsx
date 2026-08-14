"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Users, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserDialog } from "./user-dialog"
import { deleteUser } from "@/actions/users"

type Role = { id: string; label: string }
type User = {
  id: string
  name: string
  email: string
  isActive: boolean
  createdAt: Date
  roleId: string
  role: { label: string }
}

interface Props {
  users: User[]
  roles: Role[]
}

const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }

export function UsersSection({ users, roles }: Props) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  function openCreate() {
    setEditingUser(null)
    setDialogOpen(true)
  }

  function openEdit(user: User) {
    setEditingUser(user)
    setDialogOpen(true)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Deseja remover o usuário "${name}"? Essa ação não pode ser desfeita.`)) return
    const result = await deleteUser(id)
    if (!result.success) {
      toast.error(result.error)
    } else {
      toast.success("Usuário removido")
      router.refresh()
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "16px",
          color: "#16181c",
          textTransform: "uppercase",
          letterSpacing: "0.02em",
        }}>
          Usuários
        </h2>
        <button
          onClick={openCreate}
          className="btn-clip text-white inline-flex items-center px-4 py-2 font-display font-bold text-[13px] uppercase tracking-[0.02em]"
        >
          Novo Usuário
        </button>
      </div>

      <div
        className="hidden sm:grid px-3 py-2 bg-[#f5f6f7]"
        style={{ ...mono, fontSize: "11px", color: "#9ba1a8", gridTemplateColumns: "1.5fr 1.5fr 1fr 0.7fr 0.8fr auto" }}
      >
        <div>NOME</div>
        <div>E-MAIL</div>
        <div>PERFIL</div>
        <div>STATUS</div>
        <div>DESDE</div>
        <div />
      </div>

      <div className="border border-[#eceef0]">
        {users.length === 0 ? (
          <div className="flex items-center justify-center py-10 gap-2">
            <Users size={28} className="text-[#dde0e3]" />
            <p className="text-[13px] text-[#9ba1a8]">Nenhum usuário cadastrado</p>
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="border-b border-[#eceef0] last:border-0">
              {/* Desktop */}
              <div
                className="hidden sm:grid items-center px-3 py-3 text-[14px] hover:bg-[#f5f6f7] transition-colors"
                style={{ gridTemplateColumns: "1.5fr 1.5fr 1fr 0.7fr 0.8fr auto" }}
              >
                <div className="font-semibold text-[#16181c] truncate pr-3">{user.name}</div>
                <div style={mono} className="text-[#6b7178] text-[13px] truncate pr-3">{user.email}</div>
                <div className="text-[#6b7178] text-[13px]">{user.role.label}</div>
                <div><StatusBadge status={user.isActive ? "ATIVO" : "INATIVO"} /></div>
                <div style={mono} className="text-[#6b7178] text-[12px]">{formatDate(user.createdAt)}</div>
                <div className="flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                      <MoreHorizontal size={14} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(user)}>
                        <Pencil size={14} /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(user.id, user.name)}
                      >
                        <Trash2 size={14} /> Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              {/* Mobile */}
              <div className="sm:hidden px-3 py-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold text-[14px] text-[#16181c]">{user.name}</span>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={user.isActive ? "ATIVO" : "INATIVO"} />
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                        <MoreHorizontal size={14} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(user)}>
                          <Pencil size={14} /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(user.id, user.name)}
                        >
                          <Trash2 size={14} /> Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <p style={mono} className="text-[12px] text-[#6b7178]">
                  {user.email} · {user.role.label}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editingUser}
        roles={roles}
      />
    </>
  )
}
