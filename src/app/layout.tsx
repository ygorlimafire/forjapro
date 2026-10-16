import type { Metadata } from "next"
import localFont from "next/font/local"
import { Toaster } from "@/components/ui/sonner"
import { getCompanySettings } from "@/lib/company-settings"
import "./globals.css"

const HEX_RE = /^#[0-9a-fA-F]{6}$/

function sanitizeColor(hex: string | null | undefined, fallback = "#b5652f"): string {
  return hex && HEX_RE.test(hex) ? hex : fallback
}

/** WCAG 2.1 relative luminance → returns "#ffffff" or "#000000" */
function brandForeground(hex: string): "#ffffff" | "#000000" {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const lin = (c: number) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  return 1.05 / (L + 0.05) >= (L + 0.05) / 0.05 ? "#ffffff" : "#000000"
}

const barlowCondensed = localFont({
  src: [
    { path: "../../public/fonts/barlow-condensed-latin-500-normal.woff2", weight: "500" },
    { path: "../../public/fonts/barlow-condensed-latin-600-normal.woff2", weight: "600" },
    { path: "../../public/fonts/barlow-condensed-latin-700-normal.woff2", weight: "700" },
    { path: "../../public/fonts/barlow-condensed-latin-800-normal.woff2", weight: "800" },
  ],
  variable: "--font-barlow-condensed",
  display: "swap",
})

const ibmPlexSans = localFont({
  src: [
    { path: "../../public/fonts/ibm-plex-sans-latin-400-normal.woff2", weight: "400" },
    { path: "../../public/fonts/ibm-plex-sans-latin-500-normal.woff2", weight: "500" },
    { path: "../../public/fonts/ibm-plex-sans-latin-600-normal.woff2", weight: "600" },
    { path: "../../public/fonts/ibm-plex-sans-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-ibm-plex-sans",
  display: "swap",
})

const ibmPlexMono = localFont({
  src: [
    { path: "../../public/fonts/ibm-plex-mono-latin-500-normal.woff2", weight: "500" },
    { path: "../../public/fonts/ibm-plex-mono-latin-600-normal.woff2", weight: "600" },
    { path: "../../public/fonts/ibm-plex-mono-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-ibm-plex-mono",
  display: "swap",
})

export async function generateMetadata(): Promise<Metadata> {
  const s = await getCompanySettings()
  return {
    title: { default: s.name, template: `%s | ${s.name}` },
    description: `${s.slogan ?? "Sistema de Gestão Comercial"} — ${s.name}`,
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getCompanySettings()
  const brand = sanitizeColor(s.primaryColor)
  const fg = brandForeground(brand)

  return (
    <html
      lang="pt-BR"
      className={`${barlowCondensed.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col"
        style={{
          ["--brand" as string]: brand,
          ["--brand-foreground" as string]: fg,
        }}
      >
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
