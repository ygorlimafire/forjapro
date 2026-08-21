import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createSupabaseAdmin } from "@/lib/supabase"

export const dynamic = "force-dynamic"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const body = await request.json()
  const { fileName, fileType, fileSize, bucket = "products", folder = "images" } = body

  if (!ALLOWED_TYPES.includes(fileType)) {
    return NextResponse.json({ error: "Formato não suportado. Use JPG, PNG, WEBP ou PDF." }, { status: 400 })
  }
  if (fileSize > MAX_SIZE) {
    return NextResponse.json({ error: "Arquivo muito grande. Máximo 10MB." }, { status: 400 })
  }

  const ext = (fileName as string).split(".").pop()?.toLowerCase() || "jpg"
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path)

    if (error || !data) {
      console.error("[signed-url] error:", error?.message, { bucket, path })
      return NextResponse.json({ error: error?.message ?? "Erro ao gerar URL de upload" }, { status: 500 })
    }

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`

    return NextResponse.json({ signedUrl: data.signedUrl, path, publicUrl })
  } catch (err) {
    console.error("[signed-url] unexpected:", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
