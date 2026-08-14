"use client"

import { useRouter } from "next/navigation"

interface Props {
  currentFrom: string
  currentTo: string
  currentTab: string
}

function toLocalYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function DateFilter({ currentFrom, currentTo, currentTab }: Props) {
  const router = useRouter()

  function navigate(from: string, to: string) {
    const p = new URLSearchParams()
    p.set("tab", currentTab)
    p.set("from", from)
    p.set("to", to)
    router.push(`/relatorios?${p.toString()}`)
  }

  function setPreset(preset: "mes" | "30d" | "ano" | "12m") {
    const now = new Date()
    let from: Date, to: Date
    switch (preset) {
      case "mes":
        from = new Date(now.getFullYear(), now.getMonth(), 1)
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case "30d":
        to = now
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "ano":
        from = new Date(now.getFullYear(), 0, 1)
        to = new Date(now.getFullYear(), 11, 31)
        break
      case "12m":
        to = now
        from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        break
    }
    navigate(toLocalYMD(from), toLocalYMD(to))
  }

  const presetClass = "px-3 py-1.5 text-[12px] font-semibold border border-[#dde0e3] text-[#6b7178] hover:border-[#b5652f] hover:text-[#16181c] transition-colors"

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          defaultValue={currentFrom}
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          className="h-8 w-36 text-[12px] border border-[#dde0e3] bg-white px-2 text-[#16181c] outline-none focus:border-[#b5652f] transition-colors"
          onChange={(e) => {
            if (e.target.value) navigate(e.target.value, currentTo)
          }}
        />
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "#9ba1a8" }}>até</span>
        <input
          type="date"
          defaultValue={currentTo}
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          className="h-8 w-36 text-[12px] border border-[#dde0e3] bg-white px-2 text-[#16181c] outline-none focus:border-[#b5652f] transition-colors"
          onChange={(e) => {
            if (e.target.value) navigate(currentFrom, e.target.value)
          }}
        />
      </div>
      <div className="flex items-center gap-1">
        <button className={presetClass} onClick={() => setPreset("mes")}>Este mês</button>
        <button className={presetClass} onClick={() => setPreset("30d")}>30 dias</button>
        <button className={presetClass} onClick={() => setPreset("ano")}>Este ano</button>
        <button className={presetClass} onClick={() => setPreset("12m")}>12 meses</button>
      </div>
    </div>
  )
}
