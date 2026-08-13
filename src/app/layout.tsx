import type { Metadata } from "next"
import { Barlow_Condensed, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
})

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "FORJA PRO",
    template: "%s | FORJA PRO",
  },
  description: "Sistema de gestão comercial — FORJA PRO",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="pt-BR"
      className={`${barlowCondensed.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
