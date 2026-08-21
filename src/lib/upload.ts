const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export class UploadError extends Error {}

/**
 * Uploads a file directly from the browser to Supabase Storage.
 * The server only generates a signed URL (no file bytes pass through Vercel).
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
    throw new UploadError("Arquivo muito grande. Máximo 10MB.")
  }

  // Step 1: ask server for a signed upload URL (only metadata, no file)
  const sigRes = await fetch("/api/upload/signed-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size, bucket, folder }),
  })
  const sigData = await sigRes.json()
  if (!sigRes.ok) throw new UploadError(sigData.error ?? "Erro ao obter URL de upload")

  const { signedUrl, publicUrl } = sigData as { signedUrl: string; publicUrl: string }

  // Step 2: PUT file directly from browser to Supabase (no Vercel function involved)
  const uploadRes = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  })

  if (!uploadRes.ok) {
    const msg = await uploadRes.text().catch(() => String(uploadRes.status))
    throw new UploadError(`Falha no upload (${uploadRes.status}): ${msg}`)
  }

  return publicUrl
}
