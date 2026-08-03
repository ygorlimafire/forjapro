"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  createProductCategory,
  updateProductCategory,
  toggleProductCategory,
  reorderProductCategories,
} from "@/actions/products"
import { Plus, Pencil, Check, X, ChevronUp, ChevronDown } from "lucide-react"

type Category = {
  id: string
  name: string
  description: string | null
  sortOrder: number
  isActive: boolean
  _count: { products: number }
}

interface Props {
  categories: Category[]
}

function CategoryRow({
  cat,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  cat: Category
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(cat.name)
  const [description, setDescription] = useState(cat.description ?? "")
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!name.trim()) { toast.error("Nome obrigatório"); return }
    setSaving(true)
    const result = await updateProductCategory(cat.id, {
      name: name.trim(),
      description: description.trim() || undefined,
    })
    setSaving(false)
    if (result.success) {
      setEditing(false)
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  async function toggle() {
    const result = await toggleProductCategory(cat.id, !cat.isActive)
    if (result.success) router.refresh()
    else toast.error(result.error)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 py-2 px-3 rounded-lg border bg-muted/40">
        <div className="flex-1 space-y-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-7 rounded border border-input bg-background px-2 text-xs focus:outline-none"
            placeholder="Nome da categoria"
            autoFocus
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-7 rounded border border-input bg-background px-2 text-xs text-muted-foreground focus:outline-none"
            placeholder="Descrição (opcional)"
          />
        </div>
        <button type="button" onClick={save} disabled={saving} className="text-green-600 hover:text-green-700">
          <Check size={14} />
        </button>
        <button
          type="button"
          onClick={() => { setEditing(false); setName(cat.name); setDescription(cat.description ?? "") }}
          className="text-muted-foreground hover:text-foreground"
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 py-2 px-3 rounded-lg border ${!cat.isActive ? "opacity-50" : ""}`}>
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          <ChevronUp size={12} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          <ChevronDown size={12} />
        </button>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium">{cat.name}</span>
        {cat.description && (
          <p className="text-xs text-muted-foreground truncate">{cat.description}</p>
        )}
      </div>
      <span className="text-xs text-muted-foreground shrink-0">
        {cat._count.products} produto{cat._count.products !== 1 ? "s" : ""}
      </span>
      <button type="button" onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground">
        <Pencil size={13} />
      </button>
      <button
        type="button"
        onClick={toggle}
        className="text-xs text-muted-foreground hover:text-foreground underline"
      >
        {cat.isActive ? "Desativar" : "Ativar"}
      </button>
    </div>
  )
}

export function ProductCategoriesPanel({ categories }: Props) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [saving, setSaving] = useState(false)

  const active = categories.filter((c) => c.isActive)
  const inactive = categories.filter((c) => !c.isActive)

  async function handleAdd() {
    if (!newName.trim()) { toast.error("Nome obrigatório"); return }
    setSaving(true)
    const result = await createProductCategory({ name: newName.trim(), description: newDesc.trim() || undefined })
    setSaving(false)
    if (result.success) {
      setAdding(false)
      setNewName("")
      setNewDesc("")
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const newOrder = [...active]
    const targetIdx = direction === "up" ? index - 1 : index + 1
    ;[newOrder[index], newOrder[targetIdx]] = [newOrder[targetIdx], newOrder[index]]
    const result = await reorderProductCategories(newOrder.map((c) => c.id))
    if (result.success) router.refresh()
    else toast.error(result.error)
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {active.map((c, i) => (
          <CategoryRow
            key={c.id}
            cat={c}
            isFirst={i === 0}
            isLast={i === active.length - 1}
            onMoveUp={() => handleMove(i, "up")}
            onMoveDown={() => handleMove(i, "down")}
          />
        ))}
      </div>

      {inactive.length > 0 && (
        <details className="text-xs text-muted-foreground cursor-pointer">
          <summary className="select-none hover:text-foreground">
            {inactive.length} inativa{inactive.length !== 1 ? "s" : ""}
          </summary>
          <div className="mt-2 space-y-1.5">
            {inactive.map((c, i) => (
              <CategoryRow
                key={c.id}
                cat={c}
                isFirst={i === 0}
                isLast={i === inactive.length - 1}
                onMoveUp={() => {}}
                onMoveDown={() => {}}
              />
            ))}
          </div>
        </details>
      )}

      {adding ? (
        <div className="flex items-center gap-2 py-2 px-3 rounded-lg border bg-muted/40">
          <div className="flex-1 space-y-1">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full h-7 rounded border border-input bg-background px-2 text-xs focus:outline-none"
              placeholder="Nome da categoria"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd() }}
            />
            <input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full h-7 rounded border border-input bg-background px-2 text-xs text-muted-foreground focus:outline-none"
              placeholder="Descrição (opcional)"
            />
          </div>
          <button type="button" onClick={handleAdd} disabled={saving} className="text-green-600 hover:text-green-700">
            <Check size={14} />
          </button>
          <button
            type="button"
            onClick={() => { setAdding(false); setNewName(""); setNewDesc("") }}
            className="text-muted-foreground hover:text-foreground"
          >
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
