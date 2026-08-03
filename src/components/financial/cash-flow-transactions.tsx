import { formatCurrency, formatDate } from "@/lib/utils"
import { ArrowDownCircle, ArrowUpCircle, FileText } from "lucide-react"

type TxEntry = {
  id: string
  date: Date
  description: string
  type: "entrada" | "saida"
  amount: number
  bankAccount: string | null
  balance?: number
}

interface Props {
  transactions: TxEntry[]
}

export function CashFlowTransactions({ transactions }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText size={32} className="text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">Nenhuma movimentação no período</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Data</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Descrição</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Conta</th>
            <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Tipo</th>
            <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Valor</th>
            <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Saldo acum.</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
              <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">{formatDate(tx.date)}</td>
              <td className="py-2.5 px-3 max-w-[200px] truncate">{tx.description}</td>
              <td className="py-2.5 px-3 text-muted-foreground hidden sm:table-cell">
                {tx.bankAccount ?? <span className="text-muted-foreground/50">—</span>}
              </td>
              <td className="py-2.5 px-3 text-right">
                {tx.type === "entrada" ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
                    <ArrowUpCircle size={11} /> Entrada
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-red-700 dark:text-red-400">
                    <ArrowDownCircle size={11} /> Saída
                  </span>
                )}
              </td>
              <td className={`py-2.5 px-3 text-right font-medium ${tx.type === "entrada" ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                {tx.type === "entrada" ? "+" : "-"}{formatCurrency(tx.amount)}
              </td>
              <td className={`py-2.5 px-3 text-right hidden md:table-cell font-medium ${(tx.balance ?? 0) >= 0 ? "text-foreground" : "text-red-600"}`}>
                {formatCurrency(tx.balance ?? 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
