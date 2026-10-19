import { NextRequest, NextResponse } from "next/server"
import React from "react"
import path from "path"
import fs from "fs"
import { renderToBuffer } from "@react-pdf/renderer"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  PurchaseOrderPDF,
  type PurchaseOrderPDFData,
  type SupplierPDFData,
  type CompanyPDFData,
} from "@/components/purchases/purchase-pdf"
import { company } from "@/config/company"

const BRAND_LOGO_PATH = path.join(process.cwd(), "public/logo", company.logoFilename)

export const dynamic = "force-dynamic"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { id } = await params

  const [po, settings] = await Promise.all([
    prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: { product: { select: { sku: true, name: true, mainImage: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.companySettings.findFirst(),
  ])

  if (!po) {
    return NextResponse.json({ error: "Pedido de compra não encontrado" }, { status: 404 })
  }

  const purchaseData: PurchaseOrderPDFData = {
    number: po.number,
    createdAt: po.createdAt,
    expectedAt: po.expectedAt,
    notes: po.notes,
    totalAmount: Number(po.totalAmount),
    items: po.items.map((item) => ({
      productSku: item.product.sku,
      productName: item.product.name,
      productImage: item.product.mainImage,
      quantity: item.quantity,
      unitCost: Number(item.unitCost),
      subtotal: Number(item.subtotal),
    })),
  }

  const supplierData: SupplierPDFData = {
    companyName: po.supplier.companyName,
    tradeName: po.supplier.tradeName,
    document: po.supplier.document,
    contactName: po.supplier.contactName,
    phone: po.supplier.phone,
    email: po.supplier.email,
  }

  const brandLogo =
    settings?.logo ?? (fs.existsSync(BRAND_LOGO_PATH) ? BRAND_LOGO_PATH : null)

  const companyData: CompanyPDFData = {
    name: settings?.name ?? company.name,
    cnpj: settings?.cnpj ?? null,
    logo: brandLogo,
    phone: settings?.phone ?? null,
    email: settings?.email ?? null,
    street: settings?.street ?? null,
    number: settings?.number ?? null,
    city: settings?.city ?? null,
    state: settings?.state ?? null,
    bankInfo: settings?.bankInfo as Record<string, string> | null,
  }

  try {
    const props = { purchase: purchaseData, supplier: supplierData, company: companyData }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-pdf renderToBuffer expects ReactElement<any>
    const element = React.createElement(PurchaseOrderPDF, props) as any
    const buffer = await renderToBuffer(element)

    const filename = `ordem-de-compra-${po.number.replace(/\//g, "-")}.pdf`

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Content-Length": String(buffer.length),
      },
    })
  } catch (err) {
    console.error("PDF generation error:", err)
    return NextResponse.json({ error: "Erro ao gerar PDF" }, { status: 500 })
  }
}
