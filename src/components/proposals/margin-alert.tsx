import { AlertTriangle } from "lucide-react"

interface MarginAlertProps {
  currentMargin: number
  minMargin: number
  className?: string
}

export function MarginAlert({ currentMargin, minMargin, className }: MarginAlertProps) {
  if (currentMargin >= minMargin) return null

  return (
    <div className={`flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/50 ${className}`}>
      <AlertTriangle size={18} className="text-red-600 mt-0.5 shrink-0" />
      <div className="text-sm">
        <p className="font-semibold text-red-700 dark:text-red-400">
          Margem abaixo do mínimo
        </p>
        <p className="text-red-600 dark:text-red-500 mt-0.5">
          Margem estimada: <strong>{currentMargin.toFixed(1)}%</strong> · Mínimo: <strong>{minMargin}%</strong>
          <span className="block mt-1">
            Esta proposta só pode ser aprovada por um Gerente ou Administrador.
          </span>
        </p>
      </div>
    </div>
  )
}
