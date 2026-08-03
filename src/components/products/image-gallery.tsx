"use client"

import { useState } from "react"
import { Trash2, Plus, ChevronUp, ChevronDown, Loader2 } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { addProductImage, removeProductImage, reorderProductImage } from "@/actions/products"
import type { ProductImage } from "@prisma/client"

interface ImageGalleryProps {
  productId: string
  images: ProductImage[]
}

export function ImageGallery({ productId, images: initialImages }: ImageGalleryProps) {
  const [images, setImages] = useState(initialImages)
  const [uploading, setUploading] = useState(false)

  async function handleAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("bucket", "products")
      fd.append("folder", "gallery")

      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }

      const result = await addProductImage(productId, data.url)
      if (!result.success) { toast.error(result.error); return }

      setImages((prev) => [
        ...prev,
        { id: result.data!.id, productId, url: data.url, alt: null, isPrimary: false, order: prev.length, createdAt: new Date() },
      ])
      toast.success("Imagem adicionada à galeria")
    } catch {
      toast.error("Erro ao adicionar imagem")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  async function handleRemove(imageId: string) {
    const result = await removeProductImage(imageId)
    if (!result.success) { toast.error(result.error); return }
    setImages((prev) => prev.filter((img) => img.id !== imageId))
    toast.success("Imagem removida")
  }

  async function handleMove(imageId: string, direction: "up" | "down") {
    const idx = images.findIndex((img) => img.id === imageId)
    const newIdx = direction === "up" ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= images.length) return

    const reordered = [...images]
    ;[reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]]
    setImages(reordered)

    await reorderProductImage(imageId, newIdx)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((img, idx) => (
          <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
            <Image src={img.url} alt={img.alt || "Imagem do produto"} fill className="object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleMove(img.id, "up")}
                  disabled={idx === 0}
                  className="p-1 rounded bg-white/20 hover:bg-white/40 disabled:opacity-30"
                >
                  <ChevronUp size={14} className="text-white" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(img.id, "down")}
                  disabled={idx === images.length - 1}
                  className="p-1 rounded bg-white/20 hover:bg-white/40 disabled:opacity-30"
                >
                  <ChevronDown size={14} className="text-white" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(img.id)}
                className="p-1 rounded bg-red-500/80 hover:bg-red-500"
              >
                <Trash2 size={14} className="text-white" />
              </button>
            </div>
          </div>
        ))}

        <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAdd}
            disabled={uploading}
          />
          {uploading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
          <span className="text-xs">{uploading ? "Enviando..." : "Adicionar"}</span>
        </label>
      </div>

      {images.length === 0 && !uploading && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Nenhuma imagem na galeria. Clique em &quot;Adicionar&quot; para incluir fotos adicionais.
        </p>
      )}
    </div>
  )
}
