import { Metadata } from "next"
import Link from "next/link"
import { getCustomers } from "@/actions/customers"
import { formatDate, formatCNPJ } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, Users, Search } from "lucide-react"
import { CustomerActions } from "@/components/customers/customer-actions"

export const metadata: Metadata = { title: "Clientes" }

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function ClientesPage({ searchParams }: Props) {
  const { q } = await searchParams
  const customers = await getCustomers(q)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users size={22} /> Clientes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {customers.length} {customers.length === 1 ? "cliente cadastrado" : "clientes cadastrados"}
          </p>
        </div>
        <Link href="/clientes/novo">
          <Button>
            <Plus size={16} />
            Novo cliente
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <form className="flex gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Buscar por nome, CNPJ/CPF, e-mail..."
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button type="submit" variant="secondary">Buscar</Button>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lista de Clientes</CardTitle>
          <CardDescription>Gerencie todos os clientes da FORJA PRO</CardDescription>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="text-center py-12">
              <Users size={40} className="mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">Nenhum cliente encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">
                {q ? "Tente outros termos de busca" : "Cadastre o primeiro cliente"}
              </p>
              {!q && (
                <Link href="/clientes/novo" className="mt-4 inline-block">
                  <Button size="sm">
                    <Plus size={14} />
                    Novo cliente
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-3 px-2 font-medium">Empresa / Nome</th>
                    <th className="text-left py-3 px-2 font-medium">CNPJ / CPF</th>
                    <th className="text-left py-3 px-2 font-medium hidden md:table-cell">E-mail</th>
                    <th className="text-left py-3 px-2 font-medium hidden lg:table-cell">Cidade</th>
                    <th className="text-left py-3 px-2 font-medium hidden lg:table-cell">Oportunidades</th>
                    <th className="text-left py-3 px-2 font-medium">Status</th>
                    <th className="text-left py-3 px-2 font-medium hidden md:table-cell">Cadastro</th>
                    <th className="py-3 px-2" />
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-2">
                        <Link href={`/clientes/${c.id}`} className="hover:underline">
                          <p className="font-medium">{c.companyName || c.tradeName || "—"}</p>
                          {c.tradeName && c.companyName && (
                            <p className="text-xs text-muted-foreground">{c.tradeName}</p>
                          )}
                        </Link>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground font-mono text-xs">
                        {formatCNPJ(c.document)}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground hidden md:table-cell">
                        {c.email || "—"}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground hidden lg:table-cell">
                        {c.city && c.state ? `${c.city}/${c.state}` : "—"}
                      </td>
                      <td className="py-3 px-2 text-center hidden lg:table-cell">
                        <Badge variant="secondary">{c._count.opportunities}</Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={c.isActive ? "default" : "secondary"}>
                          {c.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground hidden md:table-cell">
                        {formatDate(c.createdAt)}
                      </td>
                      <td className="py-3 px-2">
                        <CustomerActions customerId={c.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
