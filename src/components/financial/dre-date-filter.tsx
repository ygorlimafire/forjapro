"use client"

import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

interface Props {
  from?: string
  to?: string
}

export function DREDateFilter({ from, to }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleChange(key: "from" | "to", value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", "dre")
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">De:</label>
        <input
          type="date"
          defaultValue={from ?? ""}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none"
          onChange={(e) => handleChange("from", e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">Até:</label>
        <input
          type="date"
          defaultValue={to ?? ""}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none"
          onChange={(e) => handleChange("to", e.target.value)}
        />
      </div>
      {(from || to) && (
        <Link href="?tab=dre" className="text-xs text-muted-foreground hover:text-foreground underline">
          Limpar
        </Link>
      )}
    </div>
  )
}
