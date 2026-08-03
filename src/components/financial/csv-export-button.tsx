"use client"

import { Download } from "lucide-react"

interface Row {
  [key: string]: string | number | null | undefined | Date | boolean
}

interface Props {
  data: Row[]
  filename: string
  columns: { key: string; label: string }[]
}

function toCsv(data: Row[], columns: { key: string; label: string }[]): string {
  const header = columns.map((c) => `"${c.label}"`).join(",")
  const rows = data.map((row) =>
    columns.map((c) => {
      const val = row[c.key]
      if (val == null) return ""
      if (val instanceof Date) return val.toLocaleDateString("pt-BR")
      const str = String(val)
      return `"${str.replace(/"/g, '""')}"`
    }).join(",")
  )
  return [header, ...rows].join("\n")
}

export function CsvExportButton({ data, filename, columns }: Props) {
  function handleExport() {
    const csv = toCsv(data, columns)
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium"
    >
      <Download size={12} />
      Exportar CSV
    </button>
  )
}
