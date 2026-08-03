"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createExpenseCategory, updateExpenseCategory, toggleExpenseCategory } from "@/actions/financial"
import { Plus, Pencil, Check, X } from "lucide-react"

const PRESET_COLORS = [
  "#6366F1", "#8B5CF6", "#EC4899", "#EF4444", "#F97316",
  "#F59E0B", "#84CC16", "#22C55E", "#14B8A6", "#0EA5E9",
  "#3B82F6", "#6B7280",
]

type Category = {
  id: string
  name: string
  type: "FIXA" | "VARIAVEL"
  color: string
  isActive: boolean
}

interface Props {
  categories: Category[]
}

function CategoryRow({ cat }: { cat: Category }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(cat.name)
  const [type, setType] = useState<"FIXA" | "VARIAVEL">(cat.type)
  const [color, setColor] = useState(cat.color)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!name.trim()) { toast.error("Nome obrigatório"); return }
    setSaving(true)
    const result = await updateExpenseCategory(cat.id, { name: name.trim(), type, color })
    setSaving(false)
    if (result.success) {
      setEditing(false)
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  async function toggle() {
    const result = await toggleExpenseCategory(cat.id, !cat.isActive)
    if (result.success) router.refresh()
    else toast.error(result.error)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 py-2 px-3 rounded-lg border bg-muted/40">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 h-7 rounded border border-input bg-background px-2 text-xs focus:outline-none"
          autoFocus
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "FIXA" | "VARIAVEL")}
          className="h-7 rounded border border-input bg-background px-1 text-xs focus:outline-none"
        >
          <option value="VARIAVEL">Variável</option>
          <option value="FIXA">Fixa</option>
        </select>
        <div className="flex gap-1">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-4 h-4 rounded-full transition-transform ${color === c ? "scale-125 ring-1 ring-offset-1 ring-foreground" : ""}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <button type="button" onClick={save} disabled={saving} className="text-green-600 hover:text-green-700">
          <Check size={14} />
        </button>
        <button type="button" onClick={() => { setEditing(false); setName(cat.name); setType(cat.type); setColor(cat.color) }} className="text-muted-foreground hover:text-foreground">
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 py-2 px-3 rounded-lg border ${!cat.isActive ? "opacity-50" : ""}`}>
      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
      <span className="text-sm flex-1">{cat.name}</span>
      <span className={`text-xs px-1.5 py-0.5 rounded-full border ${
        cat.type === "FIXA"
          ? "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/30 dark:border-blue-900/50"
          : "text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950/30 dark:border-purple-900/50"
      }`}>{cat.type === "FIXA" ? "Fixa" : "Variável"}</span>
      <button type="button" onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground">
        <Pencil size={13} />
      </button>
      <button type="button" onClick={toggle} className="text-xs text-muted-foreground hover:text-foreground underline">
        {cat.isActive ? "Desativar" : "Ativar"}
      </button>
    </div>
  )
}

export function ExpenseCategoriesPanel({ categories }: Props) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [newType, setNewType] = useState<"FIXA" | "VARIAVEL">("VARIAVEL")
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!newName.trim()) { toast.error("Nome obrigatório"); return }
    setSaving(true)
    const result = await createExpenseCategory({ name: newName.trim(), type: newType, color: newColor })
    setSaving(false)
    if (result.success) {
      setAdding(false)
      setNewName("")
      setNewType("VARIAVEL")
      setNewColor(PRESET_COLORS[0])
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  const active = categories.filter((c) => c.isActive)
  const inactive = categories.filter((c) => !c.isActive)

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {active.map((c) => <CategoryRow key={c.id} cat={c} />)}
      </div>

      {inactive.length > 0 && (
        <details className="text-xs text-muted-foreground cursor-pointer">
          <summary className="select-none hover:text-foreground">{inactive.length} inativa{inactive.length !== 1 ? "s" : ""}</summary>
          <div className="mt-2 space-y-1.5">
            {inactive.map((c) => <CategoryRow key={c.id} cat={c} />)}
          </div>
        </details>
      )}

      {adding ? (
        <div className="flex items-center gap-2 py-2 px-3 rounded-lg border bg-muted/40">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 h-7 rounded border border-input bg-background px-2 text-xs focus:outline-none"
            placeholder="Nome da categoria"
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd() }}
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as "FIXA" | "VARIAVEL")}
            className="h-7 rounded border border-input bg-background px-1 text-xs focus:outline-none"
          >
            <option value="VARIAVEL">Variável</option>
            <option value="FIXA">Fixa</option>
          </select>
          <div className="flex gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                className={`w-4 h-4 rounded-full transition-transform ${newColor === c ? "scale-125 ring-1 ring-offset-1 ring-foreground" : ""}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button type="button" onClick={handleAdd} disabled={saving} className="text-green-600 hover:text-green-700">
            <Check size={14} />
          </button>
          <button type="button" onClick={() => { setAdding(false); setNewName("") }} className="text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
        >
          <Plus size={12} /> Nova categoria
        </button>
      )}
    </div>
  )
}
