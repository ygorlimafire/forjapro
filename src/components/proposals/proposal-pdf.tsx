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

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProposalPDFData = {
  number: string
  createdAt: Date
  validityDays: number
  nature: string
  paymentCondition: string | null
  installments: number | null
  freight: number
  totalProducts: number
  totalAmount: number
  additionalInfo: string | null
  customer: {
    companyName: string | null
    tradeName: string | null
    document: string
    street: string | null
    number: string | null
    complement: string | null
    neighborhood: string | null
    city: string | null
    state: string | null
    zipCode: string | null
  }
  seller: {
    name: string | null
    email: string | null
  } | null
  items: Array<{
    position: number
    productSku: string
    productName: string
    productImage: string | null
    productDescription: string | null
    technicalSpecs: Record<string, string> | null
    listPrice: number
    ipiPct: number
    discountPct: number
    netPrice: number
    quantity: number
    subtotal: number
  }>
}

export type CompanyPDFData = {
  name: string
  cnpj: string | null
  logo: string | null
  phone: string | null
  email: string | null
  street: string | null
  number: string | null
  city: string | null
  state: string | null
  bankInfo: Record<string, string> | null
}

export type TermPDFData = {
  key: string
  title: string
  content: string
  order: number
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

function buildAddress(customer: ProposalPDFData["customer"]) {
  const parts = [
    customer.street,
    customer.number,
    customer.complement,
    customer.neighborhood,
    customer.city && customer.state ? `${customer.city}/${customer.state}` : customer.city || customer.state,
    customer.zipCode,
  ].filter(Boolean)
  return parts.join(", ")
}

function getSpecBullets(item: ProposalPDFData["items"][0]): string[] {
  if (item.technicalSpecs && Object.keys(item.technicalSpecs).length > 0) {
    return Object.values(item.technicalSpecs)
  }
  if (item.productDescription) {
    return item.productDescription
      .split(/\n|;/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

// ─── Colors & Constants ───────────────────────────────────────────────────────

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

// Price column widths (must sum to CONTENT_W)
const COL = {
  num: 22,
  code: 52,
  specs: CONTENT_W * 0.38,
  get product() { return CONTENT_W - this.num - this.code - this.specs },
}

const PRICE_COL = {
  qtd: CONTENT_W * 0.09,
  tabela: CONTENT_W * 0.2,
  ipi: CONTENT_W * 0.09,
  desc: CONTENT_W * 0.09,
  net: CONTENT_W * 0.2,
  sub: CONTENT_W * 0.2,
  get pad() { return CONTENT_W - this.qtd - this.tabela - this.ipi - this.desc - this.net - this.sub },
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: C.textMain,
    backgroundColor: "#ffffff",
  },

  // Header
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
  logoBoxText: {
    color: "#ffffff",
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
  },
  logoTextWrap: {
    flexDirection: "column",
  },
  logoName: {
    color: "#ffffff",
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
  },
  logoTagline: {
    color: "#aaaaaa",
    fontSize: 6.5,
  },

  // Body padding
  body: {
    paddingHorizontal: MARGIN,
    paddingTop: 10,
  },

  // Metadata
  metaLine: {
    flexDirection: "row",
    marginBottom: 2,
  },
  metaLabel: { fontSize: 7.5, color: C.textMuted, marginRight: 3 },
  metaValue: { fontSize: 7.5, fontFamily: "Helvetica-Bold" },

  // Client block
  clientSection: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    borderTopStyle: "solid",
    marginTop: 10,
    paddingTop: 6,
  },
  clientRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  clientLeft: { flex: 1 },
  clientRight: { flex: 1, alignItems: "flex-end" },
  clientLabel: { fontSize: 7.5, color: C.textMuted, marginRight: 3 },
  clientValue: { fontSize: 7.5, fontFamily: "Helvetica-Bold" },
  clientInline: { flexDirection: "row" },

  // Items header bar
  itemsHeader: {
    flexDirection: "row",
    backgroundColor: C.dark,
    marginTop: 12,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  itemsHeaderCell: {
    color: "#ffffff",
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
  },

  // Item block wrapper
  itemBlock: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: "solid",
    marginTop: 2,
  },

  // Item main content row
  itemMainRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: "solid",
    minHeight: 55,
  },

  // Number cell
  itemNumCell: {
    width: COL.num,
    borderRightWidth: 1,
    borderRightColor: C.border,
    borderRightStyle: "solid",
    justifyContent: "center",
    alignItems: "center",
  },
  itemNum: { fontSize: 8, fontFamily: "Helvetica-Bold" },

  // Code cell
  itemCodeCell: {
    width: COL.code,
    borderRightWidth: 1,
    borderRightColor: C.border,
    borderRightStyle: "solid",
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  itemCode: { fontSize: 6.5, color: C.textMuted, textAlign: "center" },

  // Product cell (image + name)
  itemProductCell: {
    width: COL.product,
    borderRightWidth: 1,
    borderRightColor: C.border,
    borderRightStyle: "solid",
    padding: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  itemImage: {
    width: 44,
    height: 44,
    backgroundColor: "#eeeeee",
    marginRight: 6,
  },
  itemProductName: {
    flex: 1,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
  },

  // Specs cell
  itemSpecsCell: {
    width: COL.specs,
    padding: 4,
  },
  itemSpecsTitle: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
    color: C.textMuted,
  },
  itemSpecBullet: {
    fontSize: 6,
    color: C.textMuted,
    marginBottom: 1,
  },

  // Price header
  priceHeaderRow: {
    flexDirection: "row",
    backgroundColor: C.headerGray,
    paddingVertical: 3,
  },
  priceValRow: {
    flexDirection: "row",
    backgroundColor: C.rowGray,
    paddingVertical: 3,
  },
  priceCell: {
    textAlign: "center",
    fontSize: 6.5,
  },
  priceCellBold: {
    textAlign: "center",
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
  },

  // Totals
  totalsSection: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: C.dark,
    borderTopStyle: "solid",
    paddingTop: 6,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  totalLabel: { fontSize: 7.5, color: C.textMuted },
  totalValue: { fontSize: 7.5, fontFamily: "Helvetica-Bold" },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 6,
    borderTopWidth: 1,
    borderTopColor: C.border,
    borderTopStyle: "solid",
    paddingTop: 4,
    marginTop: 2,
  },
  grandTotalLabel: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },
  grandTotalValue: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 4,
  },
  infoRow: {
    flexDirection: "row",
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  infoLabel: { fontSize: 7, color: C.textMuted, width: 130 },
  infoValue: { fontSize: 7, flex: 1 },

  // Section separator bar
  sectionBar: {
    backgroundColor: C.dark,
    paddingVertical: 5,
    paddingHorizontal: 6,
    marginTop: 14,
  },
  sectionBarText: {
    color: "#ffffff",
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
  },

  // Terms page
  termsBody: {
    paddingHorizontal: MARGIN,
    paddingTop: 16,
    paddingBottom: 24,
  },
  termSection: { marginBottom: 8 },
  termTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
    color: C.dark,
  },
  termContent: {
    fontSize: 6.5,
    color: C.textMuted,
    lineHeight: 1.5,
  },

  bankBlock: {
    marginTop: 10,
    padding: 8,
    backgroundColor: C.rowGray,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: "solid",
  },
  bankTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  bankRow: { flexDirection: "row", marginBottom: 2 },
  bankLabel: { fontSize: 7, color: C.textMuted, width: 110 },
  bankValue: { fontSize: 7, fontFamily: "Helvetica-Bold" },

  validityBox: {
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: "solid",
  },
  validityText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    color: C.textMuted,
  },

  signatureArea: {
    marginTop: 20,
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
        <Image src={company.logo} style={{ width: 34, height: 34, marginRight: 8 }} />
      ) : (
        <View style={s.logoBox}>
          <Text style={s.logoBoxText}>F</Text>
        </View>
      )}
      <View style={s.logoTextWrap}>
        <Text style={s.logoName}>{company.name}</Text>
        <Text style={s.logoTagline}>EQUIPAMENTOS PROFISSIONAIS</Text>
      </View>
    </View>
  )
}

function MetaBlock({ proposal }: { proposal: ProposalPDFData }) {
  return (
    <View style={s.body}>
      <View style={s.metaLine}>
        <Text style={s.metaLabel}>Orçamento:</Text>
        <Text style={s.metaValue}>{proposal.number}</Text>
      </View>
      <View style={s.metaLine}>
        <Text style={s.metaLabel}>Data:</Text>
        <Text style={s.metaValue}>{fmtDate(proposal.createdAt)}</Text>
      </View>
      <View style={s.metaLine}>
        <Text style={s.metaLabel}>Validade da proposta:</Text>
        <Text style={s.metaValue}>{proposal.validityDays} DIAS</Text>
      </View>
      <View style={s.metaLine}>
        <Text style={s.metaLabel}>Natureza da Operação:</Text>
        <Text style={s.metaValue}>{proposal.nature}</Text>
      </View>
    </View>
  )
}

function ClientBlock({ proposal }: { proposal: ProposalPDFData }) {
  const address = buildAddress(proposal.customer)
  const clientName =
    proposal.customer.companyName ||
    proposal.customer.tradeName ||
    proposal.customer.document

  return (
    <View style={[s.body, s.clientSection]}>
      <View style={s.clientRow}>
        <View style={s.clientLeft}>
          <View style={s.clientInline}>
            <Text style={s.clientLabel}>Cliente:</Text>
            <Text style={s.clientValue}>{clientName}</Text>
          </View>
        </View>
        <View style={s.clientRight}>
          <View style={s.clientInline}>
            <Text style={s.clientLabel}>CNPJ:</Text>
            <Text style={s.clientValue}>{formatDoc(proposal.customer.document)}</Text>
          </View>
        </View>
      </View>
      <View style={s.clientRow}>
        <View style={s.clientLeft}>
          <View style={s.clientInline}>
            <Text style={s.clientLabel}>Nome Fantasia:</Text>
            <Text style={s.clientValue}>{proposal.customer.tradeName || ""}</Text>
          </View>
        </View>
        <View style={s.clientRight}>
          <View style={s.clientInline}>
            <Text style={s.clientLabel}>Endereço:</Text>
            <Text style={s.clientValue}>{address}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

function ItemsHeaderRow() {
  return (
    <View style={[s.itemsHeader, { paddingHorizontal: MARGIN }]}>
      <Text style={[s.itemsHeaderCell, { width: COL.num }]}>#</Text>
      <Text style={[s.itemsHeaderCell, { width: COL.code }]}>CÓD.</Text>
      <Text style={[s.itemsHeaderCell, { width: COL.product }]}>PRODUTO</Text>
      <Text style={[s.itemsHeaderCell, { flex: 1 }]}>FICHA TÉCNICA</Text>
    </View>
  )
}

function ItemRow({
  item,
  index,
}: {
  item: ProposalPDFData["items"][0]
  index: number
}) {
  const bullets = getSpecBullets(item)

  return (
    <View style={[s.itemBlock, { marginHorizontal: MARGIN }]}>
      {/* Main content */}
      <View style={s.itemMainRow}>
        <View style={s.itemNumCell}>
          <Text style={s.itemNum}>{index + 1}</Text>
        </View>
        <View style={s.itemCodeCell}>
          <Text style={s.itemCode}>{item.productSku}</Text>
        </View>
        <View style={s.itemProductCell}>
          {item.productImage ? (
            <Image src={item.productImage} style={s.itemImage} />
          ) : (
            <View style={[s.itemImage, { justifyContent: "center", alignItems: "center" }]}>
              <Text style={{ fontSize: 6, color: "#aaaaaa" }}>SEM\nFOTO</Text>
            </View>
          )}
          <Text style={s.itemProductName}>{item.productName}</Text>
        </View>
        <View style={s.itemSpecsCell}>
          {bullets.length > 0 && (
            <>
              <Text style={s.itemSpecsTitle}>INFORMAÇÃO TÉCNICA:</Text>
              {bullets.map((b, i) => (
                <Text key={i} style={s.itemSpecBullet}>- {b}</Text>
              ))}
            </>
          )}
        </View>
      </View>

      {/* Price header */}
      <View style={s.priceHeaderRow}>
        <Text style={[s.priceCellBold, { width: COL.num + COL.code }]}></Text>
        <Text style={[s.priceCellBold, { width: PRICE_COL.qtd }]}>QTDE.</Text>
        <Text style={[s.priceCellBold, { width: PRICE_COL.tabela }]}>PREÇO TABELA</Text>
        <Text style={[s.priceCellBold, { width: PRICE_COL.ipi }]}>IPI</Text>
        <Text style={[s.priceCellBold, { width: PRICE_COL.desc }]}>DESC.</Text>
        <Text style={[s.priceCellBold, { width: PRICE_COL.net }]}>PREÇO LÍQUIDO</Text>
        <Text style={[s.priceCellBold, { flex: 1 }]}>SUBTOTAL</Text>
      </View>

      {/* Price values */}
      <View style={s.priceValRow}>
        <Text style={[s.priceCell, { width: COL.num + COL.code }]}></Text>
        <Text style={[s.priceCell, { width: PRICE_COL.qtd }]}>{item.quantity}</Text>
        <Text style={[s.priceCell, { width: PRICE_COL.tabela }]}>{brl(item.listPrice)}</Text>
        <Text style={[s.priceCell, { width: PRICE_COL.ipi }]}>{item.ipiPct}%</Text>
        <Text style={[s.priceCell, { width: PRICE_COL.desc }]}>{item.discountPct}%</Text>
        <Text style={[s.priceCell, { width: PRICE_COL.net }]}>{brl(item.netPrice)}</Text>
        <Text style={[s.priceCell, { flex: 1 }]}>{brl(item.subtotal)}</Text>
      </View>
    </View>
  )
}

function TotalsSection({
  proposal,
}: {
  proposal: ProposalPDFData
}) {
  return (
    <View style={[s.totalsSection, { marginHorizontal: MARGIN }]}>
      <View style={s.totalRow}>
        <Text style={s.totalLabel}>Valor total em produtos:</Text>
        <Text style={s.totalValue}>{brl(proposal.totalProducts)}</Text>
      </View>
      <View style={s.totalRow}>
        <Text style={s.totalLabel}>Valor do frete:</Text>
        <Text style={s.totalValue}>{brl(proposal.freight)}</Text>
      </View>
      <View style={s.grandTotalRow}>
        <Text style={s.grandTotalLabel}>Valor total:</Text>
        <Text style={s.grandTotalValue}>{brl(proposal.totalAmount)}</Text>
      </View>

      {proposal.paymentCondition && (
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Condição de Pagamento:</Text>
          <Text style={s.infoValue}>{proposal.paymentCondition}</Text>
        </View>
      )}
      {proposal.installments && proposal.installments > 1 && (
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Parcelas:</Text>
          <Text style={s.infoValue}>{proposal.installments}x</Text>
        </View>
      )}
      {proposal.seller && (
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Vendedor:</Text>
          <Text style={s.infoValue}>{proposal.seller.name || ""}</Text>
        </View>
      )}
      {proposal.additionalInfo && (
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Informações Adicionais:</Text>
          <Text style={s.infoValue}>{proposal.additionalInfo}</Text>
        </View>
      )}
      {proposal.seller?.email && (
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>E-mail:</Text>
          <Text style={s.infoValue}>{proposal.seller.email}</Text>
        </View>
      )}
    </View>
  )
}

function TermsPage({
  terms,
  company,
  proposal,
}: {
  terms: TermPDFData[]
  company: CompanyPDFData
  proposal: ProposalPDFData
}) {
  const bankInfo = company.bankInfo

  return (
    <Page size="A4" style={s.page}>
      <Header company={company} />
      <View style={s.termsBody}>
        {terms.map((term) => (
          <View key={term.key} style={s.termSection}>
            <Text style={s.termTitle}>{term.key}. {term.title.toUpperCase()}</Text>
            <Text style={s.termContent}>{term.content}</Text>
          </View>
        ))}

        {bankInfo && (bankInfo.banco || bankInfo.pix) && (
          <View style={s.bankBlock}>
            <Text style={s.bankTitle}>DADOS BANCÁRIOS</Text>
            {bankInfo.razaoSocial && (
              <View style={s.bankRow}>
                <Text style={s.bankLabel}>Razão Social:</Text>
                <Text style={s.bankValue}>{bankInfo.razaoSocial}</Text>
              </View>
            )}
            {bankInfo.banco && (
              <View style={s.bankRow}>
                <Text style={s.bankLabel}>Banco:</Text>
                <Text style={s.bankValue}>{bankInfo.banco}</Text>
              </View>
            )}
            {bankInfo.agencia && (
              <View style={s.bankRow}>
                <Text style={s.bankLabel}>Agência:</Text>
                <Text style={s.bankValue}>{bankInfo.agencia}</Text>
              </View>
            )}
            {bankInfo.conta && (
              <View style={s.bankRow}>
                <Text style={s.bankLabel}>Conta Corrente:</Text>
                <Text style={s.bankValue}>{bankInfo.conta}</Text>
              </View>
            )}
            {bankInfo.pix && (
              <View style={s.bankRow}>
                <Text style={s.bankLabel}>PIX:</Text>
                <Text style={s.bankValue}>{bankInfo.pix}</Text>
              </View>
            )}
            {bankInfo.cnpj && (
              <View style={s.bankRow}>
                <Text style={s.bankLabel}>CNPJ:</Text>
                <Text style={s.bankValue}>{bankInfo.cnpj}</Text>
              </View>
            )}
          </View>
        )}

        <View style={s.validityBox}>
          <Text style={s.validityText}>
            A validade da proposta é de {proposal.validityDays} dias corridos, a partir da data de emissão. Após essa data, consulte-nos para confirmação dos preços e prazos.
          </Text>
        </View>

        <View style={s.signatureArea}>
          <View style={s.signatureLine}>
            <Text style={s.signatureLabel}>Data: ___/___/______</Text>
          </View>
          <View style={s.signatureLine}>
            <Text style={s.signatureLabel}>Local: ________________</Text>
          </View>
          <View style={s.signatureLine}>
            <Text style={s.signatureLabel}>Responsável: ___________</Text>
          </View>
        </View>
      </View>
    </Page>
  )
}

// ─── Main Document ────────────────────────────────────────────────────────────

export function ProposalPDF({
  proposal,
  company,
  terms,
}: {
  proposal: ProposalPDFData
  company: CompanyPDFData
  terms: TermPDFData[]
}) {
  return (
    <Document
      title={`Proposta ${proposal.number}`}
      author={company.name}
      subject="Proposta Comercial"
    >
      {/* Main page(s) — react-pdf auto-paginates when content overflows */}
      <Page size="A4" style={s.page}>
        <Header company={company} />
        <MetaBlock proposal={proposal} />
        <ClientBlock proposal={proposal} />
        <ItemsHeaderRow />
        {proposal.items.map((item, i) => (
          <ItemRow key={item.productSku + i} item={item} index={i} />
        ))}
        <TotalsSection proposal={proposal} />

        {/* Separator to terms */}
        <View style={[s.sectionBar, { marginHorizontal: MARGIN }]}>
          <Text style={s.sectionBarText}>CONDIÇÕES COMERCIAIS</Text>
        </View>
      </Page>

      {/* Terms & conditions page */}
      <TermsPage terms={terms} company={company} proposal={proposal} />
    </Document>
  )
}
