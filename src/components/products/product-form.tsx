"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { productSchema, type ProductFormData } from "@/lib/validations/product"
import { createProduct, updateProduct } from "@/actions/products"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Save, Loader2 } from "lucide-react"
import { formatCurrency, calculateMargin } from "@/lib/utils"
import type { Product, ProductCategory } from "@prisma/client"

interface ProductFormProps {
  product?: Product
  categories: ProductCategory[]
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter()
  const isEdit = !!product

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: product
      ? {
          sku: product.sku,
          name: product.name,
          categoryId: product.categoryId,
          description: product.description ?? "",
          mainImage: product.mainImage ?? "",
          listPrice: Number(product.listPrice),
          costPrice: Number(product.costPrice),
          desiredMargin: product.desiredMargin ? Number(product.desiredMargin) : undefined,
          warranty: product.warranty ?? "",
          isActive: product.isActive,
        }
      : { isActive: true, listPrice: 0, costPrice: 0 },
  })

  const listPrice = watch("listPrice") || 0
  const costPrice = watch("costPrice") || 0
  const realMargin = calculateMargin(listPrice, costPrice)

  async function onSubmit(data: ProductFormData) {
    const result = isEdit
      ? await updateProduct(product!.id, data)
      : await createProduct(data)

    if (result.success) {
      toast.success(isEdit ? "Produto atualizado" : "Produto criado com sucesso")
      router.push("/produtos")
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Identificação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identificação</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>SKU *</Label>
            <Input placeholder="FP-0001" {...register("sku")} />
            {errors.sku && <p className="text-xs text-destructive">{errors.sku.message}</p>}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Nome do Produto *</Label>
            <Input placeholder="Ex: Fogão Industrial 6 bocas" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Categoria *</Label>
            <select
              className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              {...register("categoryId")}
            >
              <option value="">Selecione...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Garantia</Label>
            <Input placeholder="Ex: 12 meses" {...register("warranty")} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Imagem principal (URL)</Label>
            <Input type="url" placeholder="https://..." {...register("mainImage")} />
            {errors.mainImage && <p className="text-xs text-destructive">{errors.mainImage.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Preços */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preços e Margens</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Preço de Tabela (R$) *</Label>
            <Input type="number" step="0.01" min="0" placeholder="0,00" {...register("listPrice", { valueAsNumber: true })} />
            {errors.listPrice && <p className="text-xs text-destructive">{errors.listPrice.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Custo de Compra (R$) *</Label>
            <Input type="number" step="0.01" min="0" placeholder="0,00" {...register("costPrice", { valueAsNumber: true })} />
          </div>

          <div className="space-y-2">
            <Label>Margem Desejada (%)</Label>
            <Input type="number" step="0.1" min="0" max="100" placeholder="0" {...register("desiredMargin", { valueAsNumber: true })} />
          </div>

          {(listPrice > 0 || costPrice > 0) && (
            <div className="sm:col-span-3 p-3 rounded-lg bg-muted flex items-center gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Margem real: </span>
                <span className={`font-semibold ${realMargin >= 30 ? "text-green-600" : realMargin >= 15 ? "text-yellow-600" : "text-red-600"}`}>
                  {realMargin.toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Lucro bruto: </span>
                <span className="font-semibold">{formatCurrency(listPrice - costPrice)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Descrição */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Descrição Comercial</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Descreva o produto para uso comercial — benefícios, diferenciais, aplicações..."
            rows={4}
            {...register("description")}
          />
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Produto ativo</p>
              <p className="text-xs text-muted-foreground">Produtos inativos não aparecem em propostas</p>
            </div>
            <Switch
              checked={watch("isActive")}
              onCheckedChange={(v) => setValue("isActive", v)}
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
          {isSubmitting ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar produto"}
        </Button>
      </div>
    </form>
  )
}
