/* eslint-disable jsx-a11y/alt-text */
import React from "react"
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer"
import type { CompanyPDFData } from "@/components/proposals/proposal-pdf"

export type { CompanyPDFData }

// ─── Types ────────────────────────────────────────────────────────────────────

export type SupplierPDFData = {
  companyName: string
  tradeName: string | null
  document: string | null
  contactName: string | null
  phone: string | null
  email: string | null
}

export type PurchaseOrderPDFData = {
  number: string
  createdAt: Date
  expectedAt: Date | null
  notes: string | null
  totalAmount: number
  items: Array<{
    productSku: string
    productName: string
    productImage: string | null
    quantity: number
    unitCost: number
    subtotal: number
  }>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function brl(value: number) {
  const formatted = value
    .toFixed(2)
    .replace(".", ",")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `R$ ${formatted}`
}

function fmtDate(date: Date) {
  const d = new Date(date)
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function formatDoc(doc: string) {
  const d = doc.replace(/\D/g, "")
  if (d.length === 14)
    return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
  if (d.length === 11)
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  return doc
}

// ─── Colors & Layout ──────────────────────────────────────────────────────────

const C = {
  dark: "#1a1a1a",
  headerGray: "#d0d0d0",
  rowGray: "#f5f5f5",
  border: "#cccccc",
  textMain: "#1a1a1a",
  textMuted: "#555555",
}

const PAGE_W = 595.28
const MARGIN = 24
const CONTENT_W = PAGE_W - MARGIN * 2

const COL = {
  num: 22,
  sku: 65,
  qty: 45,
  cost: 95,
  sub: 95,
  get name() {
    return CONTENT_W - this.num - this.sku - this.qty - this.cost - this.sub
  },
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: C.textMain,
    backgroundColor: "#ffffff",
  },

  header: {
    backgroundColor: C.dark,
    paddingHorizontal: MARGIN,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  logoBox: {
    width: 34,
    height: 34,
    backgroundColor: "#333333",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  logoBoxText: { color: "#ffffff", fontSize: 20, fontFamily: "Helvetica-Bold" },
  logoTextWrap: { flexDirection: "column" },
  logoName: { color: "#ffffff", fontSize: 15, fontFamily: "Helvetica-Bold" },
  logoTagline: { color: "#aaaaaa", fontSize: 6.5 },

  body: { paddingHorizontal: MARGIN, paddingTop: 10 },

  metaLine: { flexDirection: "row", marginBottom: 2 },
  metaLabel: { fontSize: 7.5, color: C.textMuted, marginRight: 3 },
  metaValue: { fontSize: 7.5, fontFamily: "Helvetica-Bold" },

  dividerSection: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    borderTopStyle: "solid",
    marginTop: 10,
    paddingTop: 6,
  },

  sectionBar: {
    backgroundColor: C.dark,
    paddingVertical: 5,
    paddingHorizontal: 6,
    marginTop: 14,
    marginHorizontal: MARGIN,
  },
  sectionBarText: {
    color: "#ffffff",
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
  },

  supplierRow: { flexDirection: "row", marginBottom: 3 },
  supplierLeft: { flex: 1 },
  supplierRight: { flex: 1 },
  supplierLabel: { fontSize: 7.5, color: C.textMuted, marginRight: 3 },
  supplierValue: { fontSize: 7.5, fontFamily: "Helvetica-Bold" },
  supplierInline: { flexDirection: "row" },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.dark,
    marginTop: 12,
    marginHorizontal: MARGIN,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    color: "#ffffff",
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
  },

  tableRow: {
    flexDirection: "row",
    marginHorizontal: MARGIN,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: "solid",
    minHeight: 28,
    alignItems: "center",
  },
  tableCell: { fontSize: 7, color: C.textMain },
  tableCellMuted: { fontSize: 7, color: C.textMuted },
  tableCellBold: { fontSize: 7, fontFamily: "Helvetica-Bold" },

  productImage: {
    width: 20,
    height: 20,
    backgroundColor: "#eeeeee",
    marginRight: 4,
    flexShrink: 0,
  },

  totalsSection: {
    marginTop: 14,
    marginHorizontal: MARGIN,
    borderTopWidth: 1,
    borderTopColor: C.dark,
    borderTopStyle: "solid",
    paddingTop: 6,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  grandTotalLabel: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },
  grandTotalValue: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },

  notesSection: {
    marginTop: 12,
    marginHorizontal: MARGIN,
    padding: 8,
    backgroundColor: C.rowGray,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: "solid",
  },
  notesTitle: { fontSize: 7.5, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  notesText: { fontSize: 7, color: C.textMuted, lineHeight: 1.5 },

  signatureArea: {
    marginTop: 28,
    marginHorizontal: MARGIN,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureLine: {
    width: 160,
    borderTopWidth: 1,
    borderTopColor: C.dark,
    borderTopStyle: "solid",
    paddingTop: 3,
    alignItems: "center",
  },
  signatureLabel: { fontSize: 7, color: C.textMuted },
})

// ─── Sub-components ───────────────────────────────────────────────────────────

function Header({ company }: { company: CompanyPDFData }) {
  return (
    <View style={s.header}>
      {company.logo ? (
        <Image
          src={company.logo}
          style={{ height: 32, width: 96, marginRight: 12, objectFit: "contain" }}
        />
      ) : (
        <>
          <View style={s.logoBox}>
            <Text style={s.logoBoxText}>F</Text>
          </View>
          <View style={s.logoTextWrap}>
            <Text style={s.logoName}>{company.name}</Text>
            <Text style={s.logoTagline}>EQUIPAMENTOS PROFISSIONAIS</Text>
          </View>
        </>
      )}
    </View>
  )
}

function MetaBlock({ purchase }: { purchase: PurchaseOrderPDFData }) {
  return (
    <View style={s.body}>
      <View style={s.metaLine}>
        <Text style={s.metaLabel}>Ordem de Compra:</Text>
        <Text style={s.metaValue}>{purchase.number}</Text>
      </View>
      <View style={s.metaLine}>
        <Text style={s.metaLabel}>Data de emissão:</Text>
        <Text style={s.metaValue}>{fmtDate(purchase.createdAt)}</Text>
      </View>
      {purchase.expectedAt && (
        <View style={s.metaLine}>
          <Text style={s.metaLabel}>Previsão de entrega:</Text>
          <Text style={s.metaValue}>{fmtDate(purchase.expectedAt)}</Text>
        </View>
      )}
    </View>
  )
}

function SupplierBlock({ supplier }: { supplier: SupplierPDFData }) {
  const supplierName = supplier.tradeName || supplier.companyName
  return (
    <View style={[s.body, s.dividerSection]}>
      <View style={s.supplierRow}>
        <View style={s.supplierLeft}>
          <View style={s.supplierInline}>
            <Text style={s.supplierLabel}>Fornecedor:</Text>
            <Text style={s.supplierValue}>{supplierName}</Text>
          </View>
        </View>
        <View style={s.supplierRight}>
          {supplier.document && (
            <View style={s.supplierInline}>
              <Text style={s.supplierLabel}>CNPJ:</Text>
              <Text style={s.supplierValue}>{formatDoc(supplier.document)}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={s.supplierRow}>
        <View style={s.supplierLeft}>
          {supplier.contactName && (
            <View style={s.supplierInline}>
              <Text style={s.supplierLabel}>Contato:</Text>
              <Text style={s.supplierValue}>{supplier.contactName}</Text>
            </View>
          )}
        </View>
        <View style={s.supplierRight}>
          {supplier.phone && (
            <View style={s.supplierInline}>
              <Text style={s.supplierLabel}>Telefone:</Text>
              <Text style={s.supplierValue}>{supplier.phone}</Text>
            </View>
          )}
        </View>
      </View>
      {supplier.email && (
        <View style={s.supplierRow}>
          <View style={s.supplierLeft}>
            <View style={s.supplierInline}>
              <Text style={s.supplierLabel}>E-mail:</Text>
              <Text style={s.supplierValue}>{supplier.email}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

function ItemsTable({ items }: { items: PurchaseOrderPDFData["items"] }) {
  return (
    <>
      <View style={s.tableHeader}>
        <Text style={[s.tableHeaderCell, { width: COL.num }]}>#</Text>
        <Text style={[s.tableHeaderCell, { width: COL.sku }]}>CÓD./SKU</Text>
        <Text style={[s.tableHeaderCell, { flex: 1 }]}>DESCRIÇÃO DO PRODUTO</Text>
        <Text style={[s.tableHeaderCell, { width: COL.qty, textAlign: "center" }]}>QTDE.</Text>
        <Text style={[s.tableHeaderCell, { width: COL.cost, textAlign: "right" }]}>CUSTO UNIT.</Text>
        <Text style={[s.tableHeaderCell, { width: COL.sub, textAlign: "right" }]}>SUBTOTAL</Text>
      </View>

      {items.map((item, i) => (
        <View
          key={item.productSku + i}
          style={[s.tableRow, { backgroundColor: i % 2 === 0 ? "#ffffff" : C.rowGray }]}
        >
          <Text style={[s.tableCellMuted, { width: COL.num, textAlign: "center" }]}>
            {i + 1}
          </Text>
          <Text style={[s.tableCellMuted, { width: COL.sku }]}>{item.productSku}</Text>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
            {item.productImage ? (
              <Image src={item.productImage} style={s.productImage} />
            ) : (
              <View style={[s.productImage, { justifyContent: "center", alignItems: "center" }]}>
                <Text style={{ fontSize: 5, color: "#aaaaaa", textAlign: "center" }}>SEM{"\n"}FOTO</Text>
              </View>
            )}
            <Text style={[s.tableCell, { flex: 1 }]}>{item.productName}</Text>
          </View>
          <Text style={[s.tableCell, { width: COL.qty, textAlign: "center" }]}>
            {item.quantity}
          </Text>
          <Text style={[s.tableCell, { width: COL.cost, textAlign: "right" }]}>
            {brl(item.unitCost)}
          </Text>
          <Text style={[s.tableCellBold, { width: COL.sub, textAlign: "right" }]}>
            {brl(item.subtotal)}
          </Text>
        </View>
      ))}
    </>
  )
}

function TotalsBlock({ totalAmount }: { totalAmount: number }) {
  return (
    <View style={s.totalsSection}>
      <View style={s.grandTotalRow}>
        <Text style={s.grandTotalLabel}>Valor total do pedido:</Text>
        <Text style={s.grandTotalValue}>{brl(totalAmount)}</Text>
      </View>
    </View>
  )
}

function SignatureArea() {
  return (
    <View style={s.signatureArea}>
      <View style={s.signatureLine}>
        <Text style={s.signatureLabel}>Data: ___/___/______</Text>
      </View>
      <View style={s.signatureLine}>
        <Text style={s.signatureLabel}>Responsável pelo pedido</Text>
      </View>
      <View style={s.signatureLine}>
        <Text style={s.signatureLabel}>Aceite do fornecedor</Text>
      </View>
    </View>
  )
}

// ─── Main Document ────────────────────────────────────────────────────────────

export function PurchaseOrderPDF({
  purchase,
  supplier,
  company,
}: {
  purchase: PurchaseOrderPDFData
  supplier: SupplierPDFData
  company: CompanyPDFData
}) {
  return (
    <Document
      title={`Ordem de Compra ${purchase.number}`}
      author={company.name}
      subject="Ordem de Compra"
    >
      <Page size="A4" style={s.page}>
        <Header company={company} />
        <MetaBlock purchase={purchase} />
        <SupplierBlock supplier={supplier} />

        <View style={s.sectionBar}>
          <Text style={s.sectionBarText}>ITENS DO PEDIDO</Text>
        </View>

        <ItemsTable items={purchase.items} />
        <TotalsBlock totalAmount={purchase.totalAmount} />

        {purchase.notes && (
          <View style={s.notesSection}>
            <Text style={s.notesTitle}>OBSERVAÇÕES</Text>
            <Text style={s.notesText}>{purchase.notes}</Text>
          </View>
        )}

        <SignatureArea />
      </Page>
    </Document>
  )
}
