import { NextRequest, NextResponse } from "next/server"
import React from "react"
import path from "path"
import fs from "fs"
import { renderToBuffer } from "@react-pdf/renderer"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ProposalPDF, type ProposalPDFData, type CompanyPDFData, type TermPDFData } from "@/components/proposals/proposal-pdf"

const BRAND_LOGO_PATH = path.join(process.cwd(), "public/logo/FORJA BRANCO.png")

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

  const [proposal, settings, terms] = await Promise.all([
    prisma.salesProposal.findUnique({
      where: { id, deletedAt: null },
      include: {
        customer: true,
        seller: true,
        items: { orderBy: { position: "asc" } },
      },
    }),
    prisma.companySettings.findFirst(),
    prisma.companyTerms.findMany({ orderBy: { order: "asc" } }),
  ])

  if (!proposal) {
    return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 })
  }

  // Convert Prisma Decimal to number for PDF component
  const proposalData: ProposalPDFData = {
    number: proposal.number,
    createdAt: proposal.createdAt,
    validityDays: proposal.validityDays,
    nature: proposal.nature,
    paymentCondition: proposal.paymentCondition,
    installments: proposal.installments,
    freight: Number(proposal.freight),
    totalProducts: Number(proposal.totalProducts),
    totalAmount: Number(proposal.totalAmount),
    additionalInfo: proposal.additionalInfo,
    customer: {
      companyName: proposal.customer.companyName,
      tradeName: proposal.customer.tradeName,
      document: proposal.customer.document,
      street: proposal.customer.street,
      number: proposal.customer.number,
      complement: proposal.customer.complement,
      neighborhood: proposal.customer.neighborhood,
      city: proposal.customer.city,
      state: proposal.customer.state,
      zipCode: proposal.customer.zipCode,
    },
    seller: proposal.seller
      ? {
          name: proposal.seller.name,
          email: proposal.seller.email,
        }
      : null,
    items: proposal.items.map((item) => ({
      position: item.position,
      productSku: item.productSku,
      productName: item.productName,
      productImage: item.productImage,
      productDescription: item.productDescription,
      technicalSpecs: item.technicalSpecs as Record<string, string> | null,
      isCustomItem: item.isCustomItem,
      customSpecs: item.customSpecs,
      listPrice: Number(item.listPrice),
      ipiPct: Number(item.ipiPct),
      discountPct: Number(item.discountPct),
      netPrice: Number(item.netPrice),
      quantity: item.quantity,
      subtotal: Number(item.subtotal),
    })),
  }

  const brandLogo = settings?.logo ?? (fs.existsSync(BRAND_LOGO_PATH) ? BRAND_LOGO_PATH : null)

  const companyData: CompanyPDFData = {
    name: settings?.name ?? "FORJA PRO",
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

  const termsData: TermPDFData[] = terms.map((t) => ({
    key: t.key,
    title: t.title,
    content: t.content,
    order: t.order,
  }))

  try {
    const props = { proposal: proposalData, company: companyData, terms: termsData }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-pdf renderToBuffer expects ReactElement<any>
    const element = React.createElement(ProposalPDF, props) as any
    const buffer = await renderToBuffer(element)

    const filename = `proposta-${proposal.number.replace(/\./g, "-")}.pdf`

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
    return NextResponse.json(
      { error: "Erro ao gerar PDF" },
      { status: 500 }
    )
  }
}
