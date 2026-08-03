import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getSupplierById } from "@/actions/suppliers"
import { SupplierForm } from "@/components/suppliers/supplier-form"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarFornecedorPage({ params }: Props) {
  const { id } = await params
  const supplier = await getSupplierById(id)

  if (!supplier) notFound()

  const displayName = supplier.tradeName || supplier.companyName

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
        <h1 className="text-xl font-bold">Editar Fornecedor</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{displayName}</p>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <SupplierForm supplier={supplier} />
      </div>
    </div>
  )
}
