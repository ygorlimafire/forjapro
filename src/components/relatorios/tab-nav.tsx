"use client"

import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { id: "comercial", label: "Comercial" },
  { id: "financeiro", label: "Financeiro" },
  { id: "estoque", label: "Estoque" },
  { id: "margem", label: "Margem" },
  { id: "funil", label: "Funil CRM" },
]

interface Props {
  currentTab: string
  currentFrom: string
  currentTo: string
}

export function TabNav({ currentTab, currentFrom, currentTo }: Props) {
  const router = useRouter()

  function navigate(tab: string) {
    const p = new URLSearchParams()
    p.set("tab", tab)
    if (currentFrom) p.set("from", currentFrom)
    if (currentTo) p.set("to", currentTo)
    router.push(`/relatorios?${p.toString()}`)
  }

  return (
    <div className="flex border-b border-[#dde0e3] overflow-x-auto">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => navigate(t.id)}
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          className={cn(
            "px-4 py-2.5 font-bold text-[13px] uppercase tracking-[0.02em] border-b-2 -mb-px transition-colors whitespace-nowrap",
            currentTab === t.id
              ? "border-[#b5652f] text-[#16181c]"
              : "border-transparent text-[#9ba1a8] hover:text-[#16181c]"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
