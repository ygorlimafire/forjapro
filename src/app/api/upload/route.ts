import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createSupabaseAdmin } from "@/lib/supabase"

export const dynamic = "force-dynamic"
export const maxDuration = 30 // seconds — Vercel default is 10s on hobby, insufficient for larger uploads

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]
const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_RETRIES = 2

async function uploadWithRetry(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  bucket: string,
  filename: string,
  buffer: Buffer,
  contentType: string
): Promise<{ error: { message: string } | null }> {
  let lastError: { message: string } | null = null

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filename, buffer, { contentType, upsert: false })

    if (!error) return { error: null }

    lastError = error
    const isFetchFailed = error.message.toLowerCase().includes("fetch failed") ||
      error.message.toLowerCase().includes("network") ||
      error.message.toLowerCase().includes("econnreset") ||
      error.message.toLowerCase().includes("timeout")

    console.error(`[upload] attempt ${attempt}/${MAX_RETRIES + 1} failed:`, error.message, { bucket, filename, isFetchFailed })

    // Only retry transient network errors, not auth/permission errors
    if (!isFetchFailed || attempt > MAX_RETRIES) break

    await new Promise((r) => setTimeout(r, attempt * 600))
  }

  return { error: lastError }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const supabase = createSupabaseAdmin()
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const bucket = (formData.get("bucket") as string) || "products"
    const folder = (formData.get("folder") as string) || "images"

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Formato não suportado. Use JPG, PNG, WEBP ou PDF." }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Arquivo muito grande. Máximo 10MB." }, { status: 400 })
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    console.log(`[upload] starting: bucket=${bucket} size=${file.size} type=${file.type}`)

    const { error: uploadError } = await uploadWithRetry(supabase, bucket, filename, buffer, file.type)

    if (uploadError) {
      console.error("[upload] all attempts failed:", uploadError.message, { bucket, filename, fileSize: file.size })
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filename)

    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    console.error("[upload] unexpected error:", err instanceof Error ? err.message : err, { cause: err instanceof Error ? err.cause : undefined })
    const message = err instanceof Error ? err.message : "Erro no upload"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
