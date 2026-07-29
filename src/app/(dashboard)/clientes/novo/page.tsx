import { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { CustomerForm } from "@/components/customers/customer-form"

export const metadata: Metadata = { title: "Novo Cliente" }

export default function NovoClientePage() {
  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <Link
          href="/clientes"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft size={14} />
          Clientes
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Novo Cliente</h1>
        <p className="text-sm text-muted-foreground mt-1">Preencha os dados para cadastrar o cliente</p>
      </div>
      <CustomerForm />
    </div>
  )
}
