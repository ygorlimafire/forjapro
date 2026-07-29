import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getCustomerById } from "@/actions/customers"
import { CustomerForm } from "@/components/customers/customer-form"
import { ChevronLeft } from "lucide-react"

export const metadata: Metadata = { title: "Editar Cliente" }

interface Props { params: Promise<{ id: string }> }

export default async function EditarClientePage({ params }: Props) {
  const { id } = await params
  const customer = await getCustomerById(id)
  if (!customer) notFound()

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <Link
          href={`/clientes/${id}`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft size={14} />
          {customer.companyName || customer.tradeName}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Editar Cliente</h1>
      </div>
      <CustomerForm customer={customer} />
    </div>
  )
}
