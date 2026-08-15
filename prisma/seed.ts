import { PrismaClient, CustomerType, LeadSource, LeadStatus, ActivityType, SupplierType, ExpenseCategoryType } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Iniciando seed da FORJA PRO...")

  // ── Permissões ────────────────────────────────────────────────────────────
  const modules = ["dashboard","crm","clientes","propostas","pedidos","produtos","estoque","compras","financeiro","relatorios","configuracoes"]
  const actions = ["view","create","edit","delete","export"]

  const permissions = await Promise.all(
    modules.flatMap((module) =>
      actions.map((action) =>
        prisma.permission.upsert({
          where: { module_action: { module, action } },
          update: {},
          create: { module, action, label: `${module}:${action}` },
        })
      )
    )
  )
  console.log(`  ✓ ${permissions.length} permissões criadas`)

  const permByKey = Object.fromEntries(
    permissions.map((p) => [`${p.module}:${p.action}`, p.id])
  )

  // ── Perfis (roles) ────────────────────────────────────────────────────────
  const roleDefinitions = [
    {
      name: "ADMIN",
      label: "Administrador",
      description: "Acesso total ao sistema",
      permissions: modules.flatMap((m) => actions.map((a) => `${m}:${a}`)),
    },
    {
      name: "GERENTE",
      label: "Gerente",
      description: "Acesso gerencial e relatórios",
      permissions: [
        "dashboard:view",
        "crm:view","crm:create","crm:edit","crm:delete",
        "clientes:view","clientes:create","clientes:edit",
        "propostas:view","propostas:create","propostas:edit",
        "pedidos:view","pedidos:create","pedidos:edit",
        "produtos:view",
        "estoque:view",
        "compras:view",
        "financeiro:view",
        "relatorios:view","relatorios:export",
        "configuracoes:view",
      ],
    },
    {
      name: "VENDEDOR",
      label: "Vendedor",
      description: "CRM, clientes e propostas",
      permissions: [
        "dashboard:view",
        "crm:view","crm:create","crm:edit",
        "clientes:view","clientes:create","clientes:edit",
        "propostas:view","propostas:create","propostas:edit",
        "pedidos:view","pedidos:create",
        "produtos:view",
      ],
    },
    {
      name: "FINANCEIRO",
      label: "Financeiro",
      description: "Módulo financeiro e relatórios",
      permissions: [
        "dashboard:view",
        "clientes:view",
        "pedidos:view",
        "financeiro:view","financeiro:create","financeiro:edit",
        "relatorios:view","relatorios:export",
      ],
    },
    {
      name: "ESTOQUE",
      label: "Estoque",
      description: "Produtos e controle de estoque",
      permissions: [
        "dashboard:view",
        "produtos:view","produtos:create","produtos:edit",
        "estoque:view","estoque:create","estoque:edit",
        "compras:view",
      ],
    },
  ]

  const roles: Record<string, string> = {}
  for (const rd of roleDefinitions) {
    const role = await prisma.role.upsert({
      where: { name: rd.name },
      update: { label: rd.label, description: rd.description },
      create: { name: rd.name, label: rd.label, description: rd.description },
    })
    roles[rd.name] = role.id

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } })
    await prisma.rolePermission.createMany({
      data: rd.permissions
        .filter((p) => permByKey[p])
        .map((p) => ({ roleId: role.id, permissionId: permByKey[p] })),
    })
  }
  console.log("  ✓ 5 perfis criados com permissões")

  // ── Usuário Admin ─────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("forjapro@2025", 12)
  const admin = await prisma.user.upsert({
    where: { email: "admin@forjapro.com.br" },
    update: {},
    create: {
      name: "Administrador FORJA PRO",
      email: "admin@forjapro.com.br",
      password: adminPassword,
      roleId: roles["ADMIN"],
      isActive: true,
    },
  })
  console.log("  ✓ Usuário admin: admin@forjapro.com.br / forjapro@2025")

  // Usuário vendedor de exemplo
  const vendedorPassword = await bcrypt.hash("vendedor123", 12)
  const vendedor = await prisma.user.upsert({
    where: { email: "carlos@forjapro.com.br" },
    update: {},
    create: {
      name: "Carlos Andrade",
      email: "carlos@forjapro.com.br",
      password: vendedorPassword,
      roleId: roles["VENDEDOR"],
      isActive: true,
    },
  })
  console.log("  ✓ Usuário vendedor: carlos@forjapro.com.br / vendedor123")

  // ── Configurações da empresa ──────────────────────────────────────────────
  await prisma.companySettings.upsert({
    where: { id: "forjapro-settings" },
    update: {},
    create: {
      id: "forjapro-settings",
      name: "FORJA PRO Equipamentos",
      cnpj: "12.345.678/0001-90",
      street: "Rua das Indústrias",
      number: "1200",
      neighborhood: "Distrito Industrial",
      city: "São Paulo",
      state: "SP",
      zipCode: "04321-000",
      phone: "(11) 3456-7890",
      email: "contato@forjapro.com.br",
      website: "www.forjapro.com.br",
      proposalSequence: 0,
      purchaseSequence: 0,
      minMarginPct: 15,
      bankInfo: { banco: "", agencia: "", conta: "", pix: "" },
    },
  })
  console.log("  ✓ Configurações da empresa")

  // ── Fornecedor principal: TRAMA ───────────────────────────────────────────
  await prisma.supplier.upsert({
    where: { id: "supplier-trama" },
    update: {
      type: SupplierType.PRODUTO,
      country: "BR",
      currency: "BRL",
      avgLeadDays: 30,
      commercialTerms: "Pagamento: 28 dias após a NF. Frete: CIF para pedidos acima de R$ 5.000.",
    },
    create: {
      id: "supplier-trama",
      type: SupplierType.PRODUTO,
      companyName: "Trama Equipamentos Industriais Ltda",
      tradeName: "Trama",
      document: "00.000.000/0001-00",
      country: "BR",
      currency: "BRL",
      contactName: "Comercial Trama",
      phone: "(11) 9999-0000",
      email: "comercial@trama.com.br",
      avgLeadDays: 30,
      commercialTerms: "Pagamento: 28 dias após a NF. Frete: CIF para pedidos acima de R$ 5.000.",
      isActive: true,
    },
  })
  console.log("  ✓ Fornecedor Trama cadastrado")

  // ── Categorias de despesa padrão ──────────────────────────────────────────
  const expenseCategories = [
    { name: "Aluguel", type: ExpenseCategoryType.FIXA, color: "#6366F1" },
    { name: "Folha de Pagamento", type: ExpenseCategoryType.FIXA, color: "#8B5CF6" },
    { name: "Energia Elétrica", type: ExpenseCategoryType.VARIAVEL, color: "#F59E0B" },
    { name: "Telefone / Internet", type: ExpenseCategoryType.FIXA, color: "#0EA5E9" },
    { name: "Marketing", type: ExpenseCategoryType.VARIAVEL, color: "#EC4899" },
    { name: "Impostos e Taxas", type: ExpenseCategoryType.FIXA, color: "#EF4444" },
    { name: "Serviços Terceiros", type: ExpenseCategoryType.VARIAVEL, color: "#14B8A6" },
    { name: "Manutenção", type: ExpenseCategoryType.VARIAVEL, color: "#F97316" },
    { name: "Frete / Logística", type: ExpenseCategoryType.VARIAVEL, color: "#84CC16" },
    { name: "Outros", type: ExpenseCategoryType.VARIAVEL, color: "#6B7280" },
  ]
  for (const ec of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { name: ec.name },
      update: {},
      create: ec,
    })
  }
  console.log(`  ✓ ${expenseCategories.length} categorias de despesa padrão`)

  // ── Termos comerciais padrão ──────────────────────────────────────────────
  const termsData = [
    {
      key: "1.0",
      title: "Prazo de Entrega",
      content: "O prazo de entrega é de 30 (trinta) dias úteis para mobiliário e 45 (quarenta e cinco) dias úteis para equipamentos, a partir da confirmação do pedido e recebimento do sinal/aprovação.",
      order: 1,
    },
    {
      key: "1.1",
      title: "Alterações de Projeto e Desenhos",
      content: "Qualquer alteração no projeto após aprovação dos desenhos técnicos implicará em revisão de prazo e valores, a ser negociada entre as partes. Não serão aceitas alterações após início da produção.",
      order: 2,
    },
    {
      key: "2.0",
      title: "Condições de Pagamento",
      content: "As condições de pagamento são as estabelecidas neste orçamento. Transferência bancária (TED/PIX) para os dados abaixo:\n\nBanco: \nAgência: \nConta Corrente: \nPIX: ",
      order: 3,
    },
    {
      key: "2.1",
      title: "Reajustamento",
      content: "Os preços constantes neste orçamento são válidos pelo período indicado na data de validade. Após o vencimento, os valores estarão sujeitos a reajuste conforme variação dos custos de aquisição e fornecimento.",
      order: 4,
    },
    {
      key: "3.0",
      title: "Entrega / Instalação",
      content: "A entrega será realizada no endereço indicado pelo cliente. O valor do frete, quando aplicável, está destacado neste orçamento. A instalação, quando prevista, será agendada após a entrega e requer acesso livre e adequado ao local, fornecimento de energia e infraestrutura necessária.",
      order: 5,
    },
    {
      key: "4.0",
      title: "Não Incluso no Orçamento",
      content: "Não estão inclusos neste orçamento: obra civil, infraestrutura elétrica, hidráulica e de gás, adequações do local, licenças e alvarás, materiais de consumo e quaisquer outros itens não expressamente mencionados.",
      order: 6,
    },
    {
      key: "5.0",
      title: "Garantia FORJA PRO",
      content: "A FORJA PRO oferece garantia de 12 (doze) meses contra defeitos de fabricação a partir da data de entrega/instalação, conforme Código de Defesa do Consumidor. A garantia não cobre: mau uso, instalação incorreta por terceiros, negligência, acidentes, desgaste natural ou ausência de manutenção preventiva.",
      order: 7,
    },
    {
      key: "6.0",
      title: "Obrigações do Cliente",
      content: "Compete ao cliente: (a) garantir acesso livre ao local de entrega e instalação; (b) providenciar infraestrutura elétrica, hidráulica e de gás conforme especificações técnicas dos equipamentos; (c) designar responsável para recebimento e conferência dos produtos; (d) efetuar os pagamentos nos prazos acordados.",
      order: 8,
    },
    {
      key: "7.0",
      title: "Obrigações da FORJA PRO",
      content: "A FORJA PRO compromete-se a: (a) fornecer os equipamentos nas especificações descritas neste orçamento; (b) cumprir os prazos acordados, salvo força maior devidamente comunicada; (c) prestar assistência técnica no período de garantia; (d) emitir nota fiscal para todos os produtos fornecidos.",
      order: 9,
    },
    {
      key: "8.0",
      title: "Validade da Proposta",
      content: "Esta proposta é válida pelo período indicado na data de validade acima. Após o vencimento, os valores e condições poderão ser revistos. A confirmação do pedido deverá ser realizada por escrito (e-mail, WhatsApp ou assinatura deste documento).",
      order: 10,
    },
  ]

  for (const term of termsData) {
    await prisma.companyTerms.upsert({
      where: { key: term.key },
      update: { title: term.title, content: term.content, order: term.order },
      create: term,
    })
  }
  console.log(`  ✓ ${termsData.length} termos comerciais padrão`)

  // ── Categorias de produtos ────────────────────────────────────────────────
  const categoriesData = [
    { name: "Cocção Gás",          description: "Fogões industriais e chapas a gás",                       sortOrder: 1 },
    { name: "Cocção Elétrica",     description: "Fornos combinados e equipamentos de cocção elétrica",      sortOrder: 2 },
    { name: "Refrigeração",        description: "Câmaras frias, refrigeradores e conservadores",            sortOrder: 3 },
    { name: "Preparação/Bancadas", description: "Processadores, bancadas inox e equipamentos de preparo",   sortOrder: 4 },
    { name: "Fritura",             description: "Fritadeiras industriais e chapas de contato",              sortOrder: 5 },
    { name: "Exaustão/Ventilação", description: "Coifas, exaustores e sistemas de ventilação",              sortOrder: 6 },
    { name: "Lavagem",             description: "Lavadoras de louça e equipamentos de higienização",        sortOrder: 7 },
    { name: "Buffet/Self-service", description: "Balcões térmicos, módulos de saída e expositores",         sortOrder: 8 },
    { name: "Grelhados",           description: "Churrasqueiras, grelhas e fornos a lenha",                 sortOrder: 9 },
  ]

  const categoryMap: Record<string, string> = {}
  for (const cat of categoriesData) {
    const c = await prisma.productCategory.upsert({
      where: { name: cat.name },
      update: { description: cat.description, sortOrder: cat.sortOrder, isActive: true },
      create: { ...cat, isActive: true },
    })
    categoryMap[cat.name] = c.id
  }
  // Desativar categorias legadas não presentes no novo seed
  await prisma.productCategory.updateMany({
    where: { name: { notIn: categoriesData.map((c) => c.name) }, isActive: true },
    data: { isActive: false },
  })
  console.log(`  ✓ ${categoriesData.length} categorias de produtos`)

  // ── Produtos de exemplo (catálogo FORJA PRO) ───────��──────────────────
  const productsData = [
    {
      sku: "FP-FOG-001",
      name: "Fogão Industrial 6 Bocas Standard",
      categoryId: categoryMap["Cocção Gás"],
      description: "Fogão industrial de 6 bocas com dupla grade, forno duplo e mesa lisa. Ideal para restaurantes e lanchonetes de médio porte.",
      listPrice: 4890.00,
      costPrice: 2850.00,
      desiredMargin: 42.0,
      warranty: "12 meses",
      technicalSpecs: {
        "Potência total": "57.000 kcal/h",
        "Bocas": "6 unidades",
        "Dimensões": "1800 x 700 x 850 mm",
        "Peso": "85 kg",
        "Combustível": "GLP / GN",
        "Material": "Aço inox AISI 304",
      },
    },
    {
      sku: "FP-FOG-002",
      name: "Fogão Industrial 4 Bocas Compacto",
      categoryId: categoryMap["Cocção Gás"],
      description: "Fogão industrial compacto de 4 bocas, perfeito para cozinhas menores. Alta potência e baixo consumo de gás.",
      listPrice: 3290.00,
      costPrice: 1890.00,
      desiredMargin: 42.6,
      warranty: "12 meses",
      technicalSpecs: {
        "Potência total": "38.000 kcal/h",
        "Bocas": "4 unidades",
        "Dimensões": "1200 x 700 x 850 mm",
        "Peso": "62 kg",
        "Combustível": "GLP / GN",
        "Material": "Aço inox AISI 304",
      },
    },
    {
      sku: "FP-FOR-001",
      name: "Forno Combinado 10 GN 1/1",
      categoryId: categoryMap["Cocção Elétrica"],
      description: "Forno combinado profissional com capacidade para 10 GN 1/1. Modos vapor, ar quente e combinado. Display digital touchscreen.",
      listPrice: 18900.00,
      costPrice: 11200.00,
      desiredMargin: 40.7,
      warranty: "24 meses",
      technicalSpecs: {
        "Capacidade": "10 GN 1/1",
        "Temperatura": "30°C - 300°C",
        "Dimensões": "875 x 760 x 1070 mm",
        "Tensão": "220V Trifásico",
        "Consumo": "14 kW",
        "Controle": "Touchscreen 5\"",
      },
    },
    {
      sku: "FP-REF-001",
      name: "Câmara Fria 10m³ Completa",
      categoryId: categoryMap["Refrigeração"],
      description: "Câmara fria modular de 10m³ com sistema de refrigeração incluso. Temperatura de -18°C a +5°C configurável. Instalação inclusa.",
      listPrice: 24500.00,
      costPrice: 14800.00,
      desiredMargin: 39.6,
      warranty: "18 meses",
      technicalSpecs: {
        "Volume útil": "10 m³",
        "Temperatura": "-18°C a +5°C",
        "Espessura painel": "100 mm PUR",
        "Compressor": "Hermético 1 HP",
        "Alimentação": "220V Monofásico",
        "Piso": "Com rebaixo 60 mm",
      },
    },
    {
      sku: "FP-REF-002",
      name: "Refrigerador Vertical 2 Portas Inox",
      categoryId: categoryMap["Refrigeração"],
      description: "Refrigerador vertical comercial de 2 portas em aço inox com iluminação LED. Capacidade 1000L.",
      listPrice: 6890.00,
      costPrice: 3950.00,
      desiredMargin: 42.7,
      warranty: "12 meses",
      technicalSpecs: {
        "Capacidade": "1000 litros",
        "Temperatura": "+2°C a +8°C",
        "Dimensões": "1360 x 690 x 2000 mm",
        "Tensão": "220V Monofásico",
        "Consumo": "350W",
        "Iluminação": "LED interno",
      },
    },
    {
      sku: "FP-FRITS-001",
      name: "Fritadeira Industrial 30L Dupla",
      categoryId: categoryMap["Fritura"],
      description: "Fritadeira industrial com 2 cubas de 15L cada, resistência blindada e termostato de segurança. Alta produtividade para fast-food.",
      listPrice: 3450.00,
      costPrice: 1980.00,
      desiredMargin: 42.6,
      warranty: "12 meses",
      technicalSpecs: {
        "Capacidade": "2 x 15 litros",
        "Temperatura max.": "200°C",
        "Tensão": "220V Monofásico",
        "Potência": "2 x 5 kW",
        "Material": "Aço inox AISI 304",
        "Cesto": "2 unidades inclusos",
      },
    },
    {
      sku: "FP-LAV-001",
      name: "Lavadora de Louça Industrial Hood Type",
      categoryId: categoryMap["Lavagem"],
      description: "Lavadora de louça do tipo Hood com ciclo de 90 segundos, pré-lavagem automática e booster elétrico. Capacidade 500 pratos/hora.",
      listPrice: 12800.00,
      costPrice: 7600.00,
      desiredMargin: 40.6,
      warranty: "18 meses",
      technicalSpecs: {
        "Capacidade": "500 pratos/hora",
        "Ciclo": "90 segundos",
        "Temp. lavagem": "60°C",
        "Temp. enxague": "85°C",
        "Tensão": "220V Trifásico",
        "Consumo água": "2,5 L/ciclo",
      },
    },
    {
      sku: "FP-PREP-001",
      name: "Processador de Alimentos 10L",
      categoryId: categoryMap["Preparação/Bancadas"],
      description: "Processador industrial com tigela de 10L, 12 velocidades e variados discos de corte incluso. Motor de 550W.",
      listPrice: 2890.00,
      costPrice: 1650.00,
      desiredMargin: 42.9,
      warranty: "12 meses",
      technicalSpecs: {
        "Capacidade tigela": "10 litros",
        "Potência motor": "550W",
        "Velocidades": "12 + pulsar",
        "Discos": "Fatiador, ralador, picador",
        "Tensão": "110/220V",
        "Peso": "8,5 kg",
      },
    },
    {
      sku: "FP-BAN-001",
      name: "Bancada de Trabalho Inox 1,5m",
      categoryId: categoryMap["Preparação/Bancadas"],
      description: "Bancada profissional em aço inox AISI 304 com prateleira inferior, borda de proteção e pés reguláveis.",
      listPrice: 1290.00,
      costPrice: 720.00,
      desiredMargin: 44.2,
      warranty: "24 meses",
      technicalSpecs: {
        "Dimensões": "1500 x 700 x 900 mm",
        "Material": "Aço inox AISI 304",
        "Espessura tampo": "1,2 mm",
        "Prateleira": "Inferior com piso inox",
        "Pés": "Reguláveis com sapatas",
        "Acabamento": "Escovado",
      },
    },
    {
      sku: "FP-COI-001",
      name: "Coifa Industrial 2m com Motor",
      categoryId: categoryMap["Exaustão/Ventilação"],
      description: "Coifa industrial de 2 metros com motor acoplado, filtros de alumínio laváveis e iluminação LED. Vazão 3.000 m³/h.",
      listPrice: 4200.00,
      costPrice: 2400.00,
      desiredMargin: 42.9,
      warranty: "12 meses",
      technicalSpecs: {
        "Largura": "2000 mm",
        "Profundidade": "800 mm",
        "Vazão": "3.000 m³/h",
        "Motor": "1 HP monofásico",
        "Filtros": "Alumínio laváveis",
        "Tensão": "220V",
      },
    },
  ]

  for (const prod of productsData) {
    await prisma.product.upsert({
      where: { sku: prod.sku },
      update: { categoryId: prod.categoryId },
      create: {
        ...prod,
        listPrice: prod.listPrice,
        costPrice: prod.costPrice,
        desiredMargin: prod.desiredMargin,
        isActive: true,
      },
    })
  }
  console.log(`  ✓ ${productsData.length} produtos de exemplo`)

  // ── Produtos sob medida (modelos customizáveis) ───────────────────────────
  const customizableProducts = [
    {
      sku: "FP-EXS-SM",
      name: "Sistema de Exaustão Sob Medida",
      categoryId: categoryMap["Exaustão/Ventilação"],
      description: "Projeto e fornecimento de sistema de exaustão dimensionado conforme especificações do cliente. Inclui coifa, dutos, motor e instalação. Medidas, capacidade e acabamento definidos por projeto.",
      listPrice: 0,
      costPrice: 0,
      stockMin: 0,
      isCustomizable: true,
      isActive: true,
    },
    {
      sku: "FP-VNT-SM",
      name: "Projeto de Ventilação Sob Medida",
      categoryId: categoryMap["Exaustão/Ventilação"],
      description: "Dimensionamento e fornecimento de sistema de ventilação forçada sob medida. Adequado para cozinhas industriais, padarias e ambientes com necessidades específicas de renovação de ar.",
      listPrice: 0,
      costPrice: 0,
      stockMin: 0,
      isCustomizable: true,
      isActive: true,
    },
  ]

  for (const prod of customizableProducts) {
    await prisma.product.upsert({
      where: { sku: prod.sku },
      update: { isCustomizable: true },
      create: prod,
    })
  }
  console.log(`  ✓ ${customizableProducts.length} produtos sob medida (modelos customizáveis)`)

  // ── Pipeline e etapas do funil ────────────────────────────────────────────
  const pipeline = await prisma.pipeline.upsert({
    where: { id: "pipeline-principal" },
    update: {},
    create: {
      id: "pipeline-principal",
      name: "Funil Comercial FORJA PRO",
      isActive: true,
    },
  })

  const stagesData = [
    { name: "Novo Lead", order: 1, color: "#6B7280", isWon: false, isLost: false },
    { name: "Primeiro Contato", order: 2, color: "#3B82F6", isWon: false, isLost: false },
    { name: "Diagnóstico", order: 3, color: "#8B5CF6", isWon: false, isLost: false },
    { name: "Proposta Enviada", order: 4, color: "#F59E0B", isWon: false, isLost: false },
    { name: "Negociação", order: 5, color: "#EF4444", isWon: false, isLost: false },
    { name: "Fechamento", order: 6, color: "#10B981", isWon: false, isLost: false },
    { name: "Ganhou", order: 7, color: "#059669", isWon: true, isLost: false },
    { name: "Perdeu", order: 8, color: "#9CA3AF", isWon: false, isLost: true },
  ]

  const stageMap: Record<string, string> = {}
  for (const stage of stagesData) {
    const existing = await prisma.pipelineStage.findFirst({
      where: { pipelineId: pipeline.id, name: stage.name },
    })
    const s = existing
      ? existing
      : await prisma.pipelineStage.create({
          data: { ...stage, pipelineId: pipeline.id },
        })
    stageMap[stage.name] = s.id
  }
  console.log(`  ✓ ${stagesData.length} etapas do funil`)

  // ── Clientes de exemplo ───────────────────────────────────────────────────
  const customersData = [
    {
      type: "PJ" as CustomerType,
      companyName: "Restaurante Bella Vista Ltda",
      tradeName: "Bella Vista",
      document: "12.345.678/0001-90",
      stateRegistration: "123.456.789.110",
      phone: "(11) 3456-7890",
      email: "contato@bellavista.com.br",
      street: "Av. Paulista",
      number: "1500",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
      zipCode: "01310-100",
    },
    {
      type: "PJ" as CustomerType,
      companyName: "Churrascaria Gaúcha SA",
      tradeName: "Gaúcha Grill",
      document: "98.765.432/0001-11",
      phone: "(11) 9876-5432",
      email: "gerencia@gauchagrll.com.br",
      street: "Rua Vergueiro",
      number: "800",
      neighborhood: "Liberdade",
      city: "São Paulo",
      state: "SP",
      zipCode: "01504-000",
    },
    {
      type: "PJ" as CustomerType,
      companyName: "Fast Food Expresso ME",
      tradeName: "Expresso Burguer",
      document: "11.222.333/0001-44",
      phone: "(11) 4444-5555",
      email: "franquia@expressoburguer.com",
      street: "Rua Augusta",
      number: "250",
      neighborhood: "Consolação",
      city: "São Paulo",
      state: "SP",
      zipCode: "01305-100",
    },
    {
      type: "PF" as CustomerType,
      tradeName: "Ana Paula Ferreira",
      document: "123.456.789-00",
      phone: "(11) 99999-8888",
      email: "ana.ferreira@email.com",
      city: "Guarulhos",
      state: "SP",
    },
  ]

  const customerMap: Record<string, string> = {}
  for (const c of customersData) {
    const existing = await prisma.customer.findFirst({
      where: { document: c.document.replace(/\D/g, "") },
    })

    const docClean = c.document.replace(/\D/g, "")

    const customer = existing ?? await prisma.customer.create({
      data: { ...c, document: docClean },
    })
    customerMap[c.tradeName || c.companyName || ""] = customer.id
  }
  console.log(`  ✓ ${customersData.length} clientes de exemplo`)

  // ── Leads e Oportunidades de exemplo ─────────────────────────────────────
  const leadsData = [
    {
      name: "Marcos Lima",
      email: "marcos@pizzeriadelicia.com",
      phone: "(11) 97777-1234",
      company: "Pizzeria Delizia",
      source: LeadSource.INDICACAO,
      status: LeadStatus.NOVO,
      notes: "Precisa de fogão e forno para nova unidade",
    },
    {
      name: "Fernanda Costa",
      email: "fernanda@cafeterianorte.com",
      phone: "(11) 98888-5678",
      company: "Cafeteria do Norte",
      source: LeadSource.INSTAGRAM,
      status: LeadStatus.CONTATO,
      notes: "Interesse em refrigeração e bancadas",
    },
    {
      name: "Roberto Santos",
      phone: "(11) 96666-4321",
      company: "Padaria Pão Quente",
      source: LeadSource.GOOGLE,
      status: LeadStatus.QUALIFICADO,
      notes: "Reforma completa da cozinha — orçamento aprovado pela diretoria",
    },
  ]

  const leadIds: string[] = []
  for (const lead of leadsData) {
    const l = await prisma.lead.create({
      data: { ...lead, assignedTo: vendedor.id },
    })
    leadIds.push(l.id)
  }
  console.log(`  ✓ ${leadsData.length} leads de exemplo`)

  // Oportunidades no funil
  const oppData = [
    {
      title: "Equipamento completo cozinha Bella Vista",
      customerId: customerMap["Bella Vista"],
      stageId: stageMap["Proposta Enviada"],
      assignedTo: vendedor.id,
      value: 28500.00,
      probability: 65,
      notes: "Cliente avaliando proposta — retorno em 3 dias",
    },
    {
      title: "Reforma churrasqueira Gaúcha Grill",
      customerId: customerMap["Gaúcha Grill"],
      stageId: stageMap["Diagnóstico"],
      assignedTo: vendedor.id,
      value: 15000.00,
      probability: 40,
      notes: "Aguardando visita técnica",
    },
    {
      title: "Fritadeiras Expresso Burguer",
      customerId: customerMap["Expresso Burguer"],
      stageId: stageMap["Negociação"],
      assignedTo: vendedor.id,
      value: 6900.00,
      probability: 80,
      notes: "Negociando desconto de 5% para 2 unidades",
    },
  ]

  for (const opp of oppData) {
    if (!opp.customerId) continue
    const o = await prisma.opportunity.create({ data: opp })
    await prisma.opportunityStageHistory.create({
      data: {
        opportunityId: o.id,
        toStageId: opp.stageId,
        userId: admin.id,
        notes: "Oportunidade criada pelo seed",
      },
    })
  }
  console.log(`  ✓ ${oppData.length} oportunidades de exemplo`)

  // Atividade de exemplo
  await prisma.activity.create({
    data: {
      type: ActivityType.LIGACAO,
      title: "Ligação de follow-up — Bella Vista",
      description: "Cliente pediu mais 3 dias para avaliar a proposta com sócios",
      userId: vendedor.id,
    },
  })

  console.log("\n✅ Seed concluído com sucesso!")
  console.log("\n📋 Credenciais de acesso:")
  console.log("   Admin:    admin@forjapro.com.br  /  forjapro@2025")
  console.log("   Vendedor: carlos@forjapro.com.br /  vendedor123")
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
