/**
 * Configuração central da instância.
 * Para criar uma nova instância (ex: Trama), altere os valores abaixo
 * antes do deploy. Nenhum outro arquivo precisa ser editado.
 */
export const company = {
  // ── Identidade ────────────────────────────────────────────────────────────
  /** Nome curto usado em títulos de página e no PDF */
  name: "FORJA PRO",
  /** Nome completo usado no seed e nas configurações da empresa */
  fullName: "FORJA PRO Equipamentos",
  /** Subtítulo exibido na tela de login */
  slogan: "Sistema de Gestão Comercial",
  /** Domínio base — usado para e-mails padrão e website */
  domain: "forjapro.com.br",

  // ── Logo ──────────────────────────────────────────────────────────────────
  /** Caminho público (next/image) para logo em fundo escuro (sidebar, login) */
  logoDark: "/logo/FORJA%20BRANCO%20SEM%20FUNDO-%20Editado.png",
  /** Nome do arquivo físico em public/logo/ — usado pelo servidor ao gerar PDF */
  logoFilename: "FORJA BRANCO SEM FUNDO- Editado.png",

  // ── Cor da marca ──────────────────────────────────────────────────────────
  // Referência apenas — o design system usa inline styles e classes Tailwind.
  // Para trocar a cor de acento em toda a UI, mova para CSS custom properties.
  brandColor: "#b5652f",

  // ── Seed — dados iniciais do banco ────────────────────────────────────────
  seed: {
    /** ID fixo do registro CompanySettings (deve ser único no banco) */
    settingsId: "forjapro-settings",
    companyEmail: "contato@forjapro.com.br",
    companyWebsite: "www.forjapro.com.br",
    companyPhone: "(11) 3456-7890",
    companyStreet: "Rua das Indústrias",
    companyNumber: "1200",
    companyNeighborhood: "Distrito Industrial",
    companyCity: "São Paulo",
    companyState: "SP",
    companyZipCode: "04321-000",
    companyCnpj: "12.345.678/0001-90",

    adminName: "Administrador FORJA PRO",
    adminEmail: "admin@forjapro.com.br",
    adminPassword: "forjapro@2025",

    vendedorName: "Carlos Andrade",
    vendedorEmail: "carlos@forjapro.com.br",
    vendedorPassword: "vendedor123",

    /** Fornecedor principal exibido como referência de compras */
    supplierName: "Trama Equipamentos Industriais Ltda",
    supplierTradeName: "Trama",
    supplierEmail: "comercial@trama.com.br",
    supplierPhone: "(11) 9999-0000",

    pipelineName: "Funil Comercial FORJA PRO",
  },
} as const

export type CompanyConfig = typeof company
