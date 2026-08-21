import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createSupabaseAdmin } from "@/lib/supabase"

export const dynamic = "force-dynamic"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]
const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_RETRIES = 2

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

  const supabase = createSupabaseAdmin()

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path)

      if (!error && data) {
        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
        return NextResponse.json({ signedUrl: data.signedUrl, path, publicUrl })
      }

      const msg = error?.message ?? "Erro ao gerar URL"
      const isNetwork = msg.toLowerCase().includes("fetch failed") ||
        msg.toLowerCase().includes("network") ||
        msg.toLowerCase().includes("econnreset")

      console.error(`[signed-url] attempt ${attempt}/${MAX_RETRIES + 1}:`, msg, { bucket, path, isNetwork })

      if (!isNetwork || attempt > MAX_RETRIES) {
        return NextResponse.json({ error: msg }, { status: 500 })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro interno"
      const isNetwork = msg.toLowerCase().includes("fetch failed") ||
        msg.toLowerCase().includes("network") ||
        msg.toLowerCase().includes("econnreset")

      console.error(`[signed-url] attempt ${attempt}/${MAX_RETRIES + 1} threw:`, msg, { isNetwork })

      if (!isNetwork || attempt > MAX_RETRIES) {
        return NextResponse.json({ error: msg }, { status: 500 })
      }
    }

    await new Promise((r) => setTimeout(r, attempt * 500))
  }

  return NextResponse.json({ error: "Falha ao gerar URL após múltiplas tentativas" }, { status: 500 })
}
