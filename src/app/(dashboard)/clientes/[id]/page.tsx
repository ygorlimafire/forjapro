import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getCustomerById } from "@/actions/customers"
import { formatDate, formatCNPJ, formatPhone, formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, Pencil, Phone, Mail, MapPin, Star } from "lucide-react"

export const metadata: Metadata = { title: "Detalhes do Cliente" }

interface Props { params: Promise<{ id: string }> }

export default async function ClienteDetailPage({ params }: Props) {
  const { id } = await params
  const customer = await getCustomerById(id)
  if (!customer) notFound()

  const primaryContact = customer.contacts.find((c) => c.isPrimary)
  const otherContacts = customer.contacts.filter((c) => !c.isPrimary)

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <Link
          href="/clientes"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft size={14} />
          Clientes
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {customer.companyName || customer.tradeName}
            </h1>
            {customer.tradeName && customer.companyName && (
              <p className="text-muted-foreground mt-1">{customer.tradeName}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={customer.isActive ? "default" : "secondary"}>
              {customer.isActive ? "Ativo" : "Inativo"}
            </Badge>
            <Link href={`/clientes/${id}/editar`}>
              <Button variant="outline" size="sm">
                <Pencil size={14} />
                Editar
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Dados principais */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados Cadastrais</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="text-sm font-medium mt-0.5">
                  {customer.type === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {customer.type === "PJ" ? "CNPJ" : "CPF"}
                </p>
                <p className="text-sm font-medium mt-0.5 font-mono">
                  {formatCNPJ(customer.document)}
                </p>
              </div>
              {customer.stateRegistration && (
                <div>
                  <p className="text-xs text-muted-foreground">Inscrição Estadual</p>
                  <p className="text-sm font-medium mt-0.5">{customer.stateRegistration}</p>
                </div>
              )}
              {customer.phone && (
                <div>
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="text-sm font-medium mt-0.5 flex items-center gap-1">
                    <Phone size={12} /> {formatPhone(customer.phone)}
                  </p>
                </div>
              )}
              {customer.email && (
                <div>
                  <p className="text-xs text-muted-foreground">E-mail</p>
                  <p className="text-sm font-medium mt-0.5 flex items-center gap-1">
                    <Mail size={12} /> {customer.email}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Cadastrado em</p>
                <p className="text-sm font-medium mt-0.5">{formatDate(customer.createdAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          {customer.street && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin size={14} /> Endereço
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {customer.street}, {customer.number}
                  {customer.complement && ` — ${customer.complement}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {customer.neighborhood} · {customer.city}/{customer.state}
                </p>
                {customer.zipCode && (
                  <p className="text-sm text-muted-foreground">CEP: {customer.zipCode}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Observações */}
          {customer.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{customer.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contatos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contatos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {customer.contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum contato vinculado</p>
              ) : (
                <>
                  {primaryContact && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Star size={11} className="text-accent fill-accent" />
                        <span className="text-xs font-semibold text-accent">Contato principal</span>
                      </div>
                      <p className="text-sm font-medium">{primaryContact.name}</p>
                      {primaryContact.role && (
                        <p className="text-xs text-muted-foreground">{primaryContact.role}</p>
                      )}
                      {primaryContact.phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone size={10} /> {formatPhone(primaryContact.phone)}
                        </p>
                      )}
                      {primaryContact.email && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail size={10} /> {primaryContact.email}
                        </p>
                      )}
                    </div>
                  )}
                  {otherContacts.map((c) => (
                    <div key={c.id} className="space-y-1 pt-3 border-t">
                      <p className="text-sm font-medium">{c.name}</p>
                      {c.role && <p className="text-xs text-muted-foreground">{c.role}</p>}
                      {c.phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone size={10} /> {formatPhone(c.phone)}
                        </p>
                      )}
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          {/* Oportunidades recentes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Oportunidades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customer.opportunities.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma oportunidade</p>
              ) : (
                customer.opportunities.map((opp) => (
                  <div key={opp.id} className="space-y-1">
                    <p className="text-sm font-medium">{opp.title}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{opp.stage.name}</Badge>
                      {opp.value && (
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(Number(opp.value))}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
