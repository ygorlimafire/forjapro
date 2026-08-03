import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SupplierForm } from "@/components/suppliers/supplier-form"

export default function NovoFornecedorPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/fornecedores"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={15} />
          Fornecedores
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold">Novo Fornecedor</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Cadastre um fornecedor de produtos, prestador de serviços ou despesa fixa recorrente
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <SupplierForm />
      </div>
    </div>
  )
}
