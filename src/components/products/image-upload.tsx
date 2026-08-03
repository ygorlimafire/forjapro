"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, ImageIcon, Loader2 } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  className?: string
  aspectRatio?: "video" | "square"
}

export function ImageUpload({ value, onChange, className, aspectRatio = "video" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("bucket", "products")
      fd.append("folder", "main")

      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Erro no upload")
        return
      }

      onChange(data.url)
      toast.success("Imagem enviada")
    } catch {
      toast.error("Erro ao enviar imagem")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const aspectClass = aspectRatio === "square" ? "aspect-square" : "aspect-video"

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
        disabled={uploading}
      />

      {value ? (
        <div className={cn("relative group w-full rounded-lg overflow-hidden border bg-muted", aspectClass)}>
          <Image src={value} alt="Foto do produto" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              <Upload size={14} />
              Trocar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => onChange(null)}
              disabled={uploading}
            >
              <X size={14} />
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "w-full rounded-lg border-2 border-dashed border-muted-foreground/30",
            "hover:border-muted-foreground/60 hover:text-foreground transition-colors",
            "flex flex-col items-center justify-center gap-2 text-muted-foreground",
            "cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
            aspectClass
          )}
        >
          {uploading ? <Loader2 size={28} className="animate-spin" /> : <ImageIcon size={28} />}
          <span className="text-sm font-medium">
            {uploading ? "Enviando..." : "Clique para selecionar"}
          </span>
          <span className="text-xs">JPG, PNG, WEBP · máx 5MB</span>
        </button>
      )}
    </div>
  )
}
