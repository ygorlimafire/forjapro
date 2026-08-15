"use client"

import { useState } from "react"
import { useForm, useFieldArray, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { proposalSchema, type ProposalFormData, type QuickCustomerData } from "@/lib/validations/proposal"
import { createProposal, updateProposal, createQuickCustomer } from "@/actions/proposals"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProductPicker } from "./product-picker"
import { ProposalItemRow } from "./proposal-item-row"
import { MarginAlert } from "./margin-alert"
import { Save, Loader2, Plus, UserPlus, X, Pencil } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface CustomerOption {
  id: string
  displayName: string
  document: string
  phone: string | null
  email: string | null
}

interface ProposalFormProps {
  customers: CustomerOption[]
  opportunities?: { id: string; title: string }[]
  minMarginPct?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proposal?: any  // existing proposal for editing
}

export function ProposalForm({
  customers,
  opportunities = [],
  minMarginPct = 15,
  proposal,
}: ProposalFormProps) {
  const router = useRouter()
  const isEdit = !!proposal
  const todayIso = new Date().toISOString().split("T")[0]

  function addMonths(baseIso: string, months: number): string {
    const d = new Date(baseIso + "T12:00:00")
    d.setMonth(d.getMonth() + months)
    return d.toISOString().split("T")[0]
  }

  function buildInstallmentDates(n: number): string[] {
    return Array.from({ length: n }, (_, i) => addMonths(todayIso, i + 1))
  }

  const [pickerOpen, setPickerOpen] = useState(false)
  const [showQuickCustomer, setShowQuickCustomer] = useState(false)
  const [creatingCustomer, setCreatingCustomer] = useState(false)
  const [quickForm, setQuickForm] = useState<Partial<QuickCustomerData>>({ type: "PJ" })
  const [localCustomers, setLocalCustomers] = useState<CustomerOption[]>(customers)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const defaultItems = proposal?.items?.map((item: any) => ({
    productId: item.productId || null,
    isCustomItem: item.isCustomItem ?? false,
    customCost: item.customCost != null ? Number(item.customCost) : null,
    customSpecs: item.customSpecs || "",
    position: item.position,
    productName: item.productName,
    productSku: item.productSku,
    productImage: item.productImage || "",
    productDescription: item.productDescription || "",
    technicalSpecs: item.technicalSpecs || {},
    listPrice: Number(item.listPrice),
    costPrice: Number(item.costPrice),
    ipiPct: Number(item.ipiPct),
    discountPct: Number(item.discountPct),
    netPrice: Number(item.netPrice),
    quantity: item.quantity,
    subtotal: Number(item.subtotal),
    estimatedMargin: Number(item.estimatedMargin || 0),
    estimatedMarginPct: Number(item.estimatedMarginPct || 0),
  })) || []

  const methods = useForm<ProposalFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(proposalSchema) as any,
    defaultValues: proposal
      ? {
          customerId: proposal.customerId,
          opportunityId: proposal.opportunityId || "",
          nature: proposal.nature,
          validityDays: proposal.validityDays,
          paymentCondition: proposal.paymentCondition || "",
          installments: proposal.installments || 1,
          installmentDueDates: proposal.installmentDueDates || [],
          freight: Number(proposal.freight),
          notes: proposal.notes || "",
          additionalInfo: proposal.additionalInfo || "",
          items: defaultItems,
        }
      : {
          nature: "VENDA",
          validityDays: 10,
          freight: 0,
          installments: 1,
          installmentDueDates: [],
          items: [],
        },
  })

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = methods
  const { fields, append, remove } = useFieldArray({ control: methods.control, name: "items" })

  const items = watch("items") || []
  const freight = watch("freight") || 0
  const installments = watch("installments") || 1
  const installmentDueDates = watch("installmentDueDates") || []

  const totalProducts = items.reduce((sum, item) => sum + (item.subtotal || 0), 0)
  const totalAmount = totalProducts + freight
  const overallMarginPct = totalProducts > 0
    ? (items.reduce((sum, item) => {
        const cost = (item.customCost != null ? item.customCost : (item.costPrice || 0))
        return sum + ((item.subtotal || 0) - cost * (item.quantity || 1))
      }, 0) / totalProducts) * 100
    : 0
  const hasBelowMinMargin = items.some(
    (item) => (item.estimatedMarginPct || 0) < minMarginPct
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleProductSelect(product: any) {
    const isCustomizable = !!product.isCustomizable
    const listPrice = isCustomizable ? 0 : Number(product.listPrice)
    const costPrice = Number(product.costPrice)
    append({
      productId: product.id,
      isCustomItem: isCustomizable,
      customCost: isCustomizable ? null : null,
      customSpecs: "",
      position: fields.length,
      productName: product.name,
      productSku: product.sku,
      productImage: product.mainImage || "",
      productDescription: product.description || "",
      technicalSpecs: isCustomizable ? {} : (product.technicalSpecs || {}),
      listPrice,
      costPrice,
      ipiPct: 0,
      discountPct: 0,
      netPrice: listPrice,
      quantity: 1,
      subtotal: listPrice,
      estimatedMargin: listPrice - costPrice,
      estimatedMarginPct: listPrice > 0
        ? ((listPrice - costPrice) / listPrice) * 100
        : 0,
    })
  }

  function handleAddAvulso() {
    append({
      productId: null,
      isCustomItem: true,
      customCost: null,
      customSpecs: "",
      position: fields.length,
      productName: "",
      productSku: "",
      productImage: "",
      productDescription: "",
      technicalSpecs: {},
      listPrice: 0,
      costPrice: 0,
      ipiPct: 0,
      discountPct: 0,
      netPrice: 0,
      quantity: 1,
      subtotal: 0,
      estimatedMargin: 0,
      estimatedMarginPct: 0,
    })
  }

  async function handleQuickCustomer() {
    if (!quickForm.document) return
    setCreatingCustomer(true)
    try {
      const result = await createQuickCustomer(quickForm)
      if (!result.success) { toast.error(result.error); return }
      const newCustomer = {
        id: result.data.id,
        displayName: result.data.displayName,
        document: quickForm.document,
        phone: quickForm.phone || null,
        email: quickForm.email || null,
      }
      setLocalCustomers((prev) => [newCustomer, ...prev])
      setValue("customerId", result.data.id)
      setShowQuickCustomer(false)
      setQuickForm({ type: "PJ" })
      toast.success("Cliente cadastrado e selecionado")
    } catch {
      toast.error("Erro ao cadastrar cliente")
    } finally {
      setCreatingCustomer(false)
    }
  }

  async function onSubmit(data: ProposalFormData) {
    const result = isEdit
      ? await updateProposal(proposal.id, data)
      : await createProposal(data)

    if (result.success) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.success(isEdit ? "Proposta atualizada" : `Proposta ${(result as any).data?.number || ""} criada`)
      router.push(isEdit ? `/propostas/${proposal.id}` : "/propostas")
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <Label>Cliente *</Label>
                <select
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  {...register("customerId")}
                >
                  <option value="">Selecione um cliente...</option>
                  {localCustomers.map((c) => (
                    <option key={c.id} value={c.id}>{c.displayName}</option>
                  ))}
                </select>
                {errors.customerId && <p className="text-xs text-destructive">{errors.customerId.message}</p>}
              </div>
              <div className="pt-6">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuickCustomer(!showQuickCustomer)}
                >
                  <UserPlus size={14} />
                  Novo
                </Button>
              </div>
            </div>

            {/* Quick customer form */}
            {showQuickCustomer && (
              <div className="border rounded-lg p-4 space-y-3 bg-muted/40">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Cadastro rápido de cliente</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setShowQuickCustomer(false)}
                  >
                    <X size={14} />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo</Label>
                    <select
                      className="w-full px-3 py-2 text-xs border rounded-md bg-background"
                      value={quickForm.type}
                      onChange={(e) => setQuickForm((p) => ({ ...p, type: e.target.value as "PJ" | "PF" }))}
                    >
                      <option value="PJ">Pessoa Jurídica</option>
                      <option value="PF">Pessoa Física</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">CNPJ / CPF *</Label>
                    <Input
                      className="h-8 text-sm"
                      placeholder="00.000.000/0001-00"
                      value={quickForm.document || ""}
                      onChange={(e) => setQuickForm((p) => ({ ...p, document: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{quickForm.type === "PJ" ? "Razão Social" : "Nome"}</Label>
                    <Input
                      className="h-8 text-sm"
                      value={quickForm.companyName || ""}
                      onChange={(e) => setQuickForm((p) => ({ ...p, companyName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Telefone</Label>
                    <Input
                      className="h-8 text-sm"
                      value={quickForm.phone || ""}
                      onChange={(e) => setQuickForm((p) => ({ ...p, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleQuickCustomer}
                  disabled={creatingCustomer || !quickForm.document}
                >
                  {creatingCustomer && <Loader2 size={14} className="animate-spin" />}
                  Cadastrar e selecionar
                </Button>
              </div>
            )}

            {/* Opportunity link */}
            {opportunities.length > 0 && (
              <div className="space-y-1">
                <Label>Vincular a oportunidade (opcional)</Label>
                <select
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  {...register("opportunityId")}
                >
                  <option value="">Nenhuma</option>
                  {opportunities.map((opp) => (
                    <option key={opp.id} value={opp.id}>{opp.title}</option>
                  ))}
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Produtos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Produtos</CardTitle>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddAvulso}
              >
                <Pencil size={14} />
                Item avulso
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPickerOpen(true)}
              >
                <Plus size={14} />
                Adicionar produto
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.length === 0 ? (
              <div
                onClick={() => setPickerOpen(true)}
                className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/40 transition-colors"
              >
                <p className="text-sm text-muted-foreground">Clique para adicionar produtos ao orçamento</p>
              </div>
            ) : (
              fields.map((field, index) => (
                <ProposalItemRow
                  key={field.id}
                  index={index}
                  onRemove={() => remove(index)}
                  minMargin={minMarginPct}
                />
              ))
            )}
            {errors.items && typeof errors.items === "object" && "message" in errors.items && (
              <p className="text-xs text-destructive">{errors.items.message as string}</p>
            )}
          </CardContent>
        </Card>

        {/* Margem abaixo do mínimo */}
        {hasBelowMinMargin && (
          <MarginAlert currentMargin={overallMarginPct} minMargin={minMarginPct} />
        )}

        {/* Financeiro */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Condições Comerciais</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Natureza da operação</Label>
              <Input {...register("nature")} placeholder="VENDA" />
            </div>

            <div className="space-y-1">
              <Label>Validade (dias)</Label>
              <Input
                type="number"
                min="1"
                max="365"
                {...register("validityDays", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-1">
              <Label>Condição de pagamento</Label>
              <select
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                {...register("paymentCondition")}
              >
                <option value="">Selecione...</option>
                <option value="A VISTA">À vista</option>
                <option value="30 DIAS">30 dias</option>
                <option value="PARCELADO">Parcelado</option>
                <option value="50/50">50% entrada + 50% entrega</option>
                <option value="30/70">30% entrada + 70% entrega</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label>Nº de parcelas</Label>
              <Input
                type="number"
                min="1"
                max="60"
                value={installments}
                onChange={(e) => {
                  const n = parseInt(e.target.value) || 1
                  setValue("installments", n)
                  setValue("installmentDueDates", n > 1 ? buildInstallmentDates(n) : [])
                }}
              />
            </div>

            {installments > 1 && installmentDueDates.length > 0 && (
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Datas de vencimento — edite livremente, sugestão +30 dias
                </Label>
                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                  {installmentDueDates.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-20 shrink-0">
                        Parcela {i + 1}/{installments}
                      </span>
                      <Input
                        type="date"
                        value={d}
                        onChange={(e) => {
                          const updated = [...installmentDueDates]
                          updated[i] = e.target.value
                          setValue("installmentDueDates", updated)
                        }}
                        className="h-8 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1 sm:col-span-2">
              <Label>Frete (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                {...register("freight", { valueAsNumber: true })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Resumo financeiro */}
        {fields.length > 0 && (
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor em produtos</span>
                  <span className="font-medium">{formatCurrency(totalProducts)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frete</span>
                  <span className="font-medium">{formatCurrency(freight)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-semibold text-base">
                  <span>Total</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Margem estimada</span>
                  <span className={overallMarginPct < minMarginPct ? "text-red-600 font-medium" : "text-muted-foreground"}>
                    {overallMarginPct.toFixed(1)}%
                  </span>
                </div>
                {installments > 1 && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{installments}× de</span>
                    <span>{formatCurrency(totalAmount / installments)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Observações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Informações adicionais (aparece no PDF)</Label>
              <Textarea
                rows={3}
                placeholder="Informações específicas para o cliente..."
                {...register("additionalInfo")}
              />
            </div>
            <div className="space-y-1">
              <Label>Notas internas (não aparece no PDF)</Label>
              <Textarea
                rows={2}
                placeholder="Anotações internas sobre esta proposta..."
                {...register("notes")}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSubmitting ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar proposta"}
          </Button>
        </div>

        <ProductPicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onSelect={handleProductSelect}
          selectedIds={fields.map((f) => (f as { productId?: string | null }).productId).filter((id): id is string => !!id)}
        />
      </form>
    </FormProvider>
  )
}
