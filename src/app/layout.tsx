import type { Metadata } from "next"
import localFont from "next/font/local"
import { Toaster } from "@/components/ui/sonner"
import { getCompanySettings } from "@/lib/company-settings"
import "./globals.css"

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

  return (
    <html
      lang="pt-BR"
      className={`${barlowCondensed.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col"
        style={{ ["--brand" as string]: s.primaryColor }}
      >
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
