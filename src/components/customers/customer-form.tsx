"use client"

import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { customerSchema, type CustomerFormData } from "@/lib/validations/customer"
import { createCustomer, updateCustomer } from "@/actions/customers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2, Loader2, Save } from "lucide-react"
import { formatCNPJ, formatCPF, formatPhone, formatCEP } from "@/lib/utils"
import type { Customer, Contact } from "@prisma/client"

interface CustomerFormProps {
  customer?: Customer & { contacts: Contact[] }
}

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter()
  const isEdit = !!customer

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(customerSchema) as any,
    defaultValues: customer
      ? {
          type: customer.type,
          companyName: customer.companyName ?? "",
          tradeName: customer.tradeName ?? "",
          document: customer.document,
          stateRegistration: customer.stateRegistration ?? "",
          phone: customer.phone ?? "",
          email: customer.email ?? "",
          zipCode: customer.zipCode ?? "",
          street: customer.street ?? "",
          number: customer.number ?? "",
          complement: customer.complement ?? "",
          neighborhood: customer.neighborhood ?? "",
          city: customer.city ?? "",
          state: customer.state ?? "",
          notes: customer.notes ?? "",
          contacts: customer.contacts.map((c) => ({
            id: c.id,
            name: c.name,
            role: c.role ?? "",
            phone: c.phone ?? "",
            email: c.email ?? "",
            isPrimary: c.isPrimary,
          })),
        }
      : { type: "PJ", contacts: [] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "contacts" })
  const type = watch("type")

  async function onSubmit(data: CustomerFormData) {
    const result = isEdit
      ? await updateCustomer(customer!.id, data)
      : await createCustomer(data)

    if (result.success) {
      toast.success(isEdit ? "Cliente atualizado" : "Cliente criado com sucesso")
      router.push("/clientes")
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  async function fetchCEP(cep: string) {
    const digits = cep.replace(/\D/g, "")
    if (digits.length !== 8) return
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setValue("street", data.logradouro)
        setValue("neighborhood", data.bairro)
        setValue("city", data.localidade)
        setValue("state", data.uf)
      }
    } catch {}
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Tipo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tipo de Pessoa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {(["PJ", "PF"] as const).map((t) => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value={t}
                  checked={type === t}
                  onChange={() => setValue("type", t)}
                  className="accent-accent"
                />
                <span className="text-sm font-medium">
                  {t === "PJ" ? "Pessoa Jurídica (PJ)" : "Pessoa Física (PF)"}
                </span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dados principais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados Cadastrais</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {type === "PJ" && (
            <div className="space-y-2">
              <Label>Razão Social</Label>
              <Input placeholder="Nome da empresa" {...register("companyName")} />
              {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label>{type === "PJ" ? "Nome Fantasia" : "Nome Completo"}</Label>
            <Input placeholder={type === "PJ" ? "Nome fantasia" : "Nome completo"} {...register("tradeName")} />
          </div>

          <div className="space-y-2">
            <Label>{type === "PJ" ? "CNPJ" : "CPF"}</Label>
            <Input
              placeholder={type === "PJ" ? "00.000.000/0000-00" : "000.000.000-00"}
              {...register("document")}
              onChange={(e) => {
                const v = type === "PJ" ? formatCNPJ(e.target.value) : formatCPF(e.target.value)
                setValue("document", v)
              }}
            />
            {errors.document && <p className="text-xs text-destructive">{errors.document.message}</p>}
          </div>

          {type === "PJ" && (
            <div className="space-y-2">
              <Label>Inscrição Estadual</Label>
              <Input placeholder="IE" {...register("stateRegistration")} />
            </div>
          )}

          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input
              placeholder="(00) 00000-0000"
              {...register("phone")}
              onChange={(e) => setValue("phone", formatPhone(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input type="email" placeholder="contato@empresa.com" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Endereço</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>CEP</Label>
            <Input
              placeholder="00000-000"
              {...register("zipCode")}
              onChange={(e) => {
                const v = formatCEP(e.target.value)
                setValue("zipCode", v)
                fetchCEP(v)
              }}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Rua</Label>
            <Input placeholder="Logradouro" {...register("street")} />
          </div>

          <div className="space-y-2">
            <Label>Número</Label>
            <Input placeholder="Nº" {...register("number")} />
          </div>

          <div className="space-y-2">
            <Label>Complemento</Label>
            <Input placeholder="Sala, andar..." {...register("complement")} />
          </div>

          <div className="space-y-2">
            <Label>Bairro</Label>
            <Input placeholder="Bairro" {...register("neighborhood")} />
          </div>

          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input placeholder="Cidade" {...register("city")} />
          </div>

          <div className="space-y-2">
            <Label>Estado (UF)</Label>
            <Input placeholder="SP" maxLength={2} {...register("state")} />
          </div>
        </CardContent>
      </Card>

      {/* Contatos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Contatos Vinculados</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: "", role: "", phone: "", email: "", isPrimary: false })}
            >
              <Plus size={14} />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum contato vinculado. Clique em &quot;Adicionar&quot; para incluir.
            </p>
          )}
          {fields.map((field, index) => (
            <div key={field.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Contato {index + 1}</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={watch(`contacts.${index}.isPrimary`)}
                      onCheckedChange={(v) => setValue(`contacts.${index}.isPrimary`, v)}
                    />
                    <span className="text-xs text-muted-foreground">Principal</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => remove(index)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Nome *</Label>
                  <Input placeholder="Nome do contato" {...register(`contacts.${index}.name`)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cargo</Label>
                  <Input placeholder="Ex: Gerente, Chef..." {...register(`contacts.${index}.role`)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Telefone</Label>
                  <Input placeholder="(00) 00000-0000" {...register(`contacts.${index}.phone`)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">E-mail</Label>
                  <Input placeholder="email@empresa.com" {...register(`contacts.${index}.email`)} />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Observações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Informações adicionais sobre o cliente..."
            rows={3}
            {...register("notes")}
          />
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isSubmitting ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar cliente"}
        </Button>
      </div>
    </form>
  )
}
