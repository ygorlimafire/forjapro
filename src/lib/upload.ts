import { getSupabaseBrowser } from "./supabase-browser"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export class UploadError extends Error {}

/**
 * Uploads a file directly from the browser to Supabase Storage using the
 * public anon key. Zero bytes pass through Vercel — the PUT goes
 * browser → Supabase directly.
 *
 * Requires Storage INSERT policies on the target bucket for the anon role.
 * See: docs/supabase-storage-policies.sql
 */
export async function uploadFileDirect(
  file: File,
  bucket = "products",
  folder = "images"
): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new UploadError("Formato não suportado. Use JPG, PNG, WEBP ou PDF.")
  }
  if (file.size > MAX_SIZE) {
    throw new UploadError("Arquivo muito grande. Máximo 5MB.")
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const supabase = getSupabaseBrowser()

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) throw new UploadError(error.message)

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
  return publicUrl
}
