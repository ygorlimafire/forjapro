# FORJA PRO — Sistema de Gestão Comercial

Sistema interno de gestão comercial para a FORJA PRO, empresa que revende equipamentos profissionais para cozinhas comerciais.

## Stack Tecnológica

- **Next.js 16** (App Router) + TypeScript
- **PostgreSQL** via Supabase + **Prisma ORM** v5
- **TailwindCSS v4** + **shadcn/ui** (base-ui)
- **NextAuth v5** (Auth.js) — autenticação com JWT
- **Zod v4** + **React Hook Form** — validação de formulários
- **dnd-kit** — Kanban drag-and-drop
- **Recharts** — gráficos (para uso futuro)

## Setup Local

### 1. Pré-requisitos

- Node.js 20+
- Conta no [Supabase](https://supabase.com) com projeto criado

### 2. Clonar e instalar

```bash
git clone <repo>
cd forjapro
npm install
```

### 3. Configurar variáveis de ambiente

Copie `.env` para `.env.local` e preencha com suas credenciais do Supabase:

```bash
cp .env .env.local
```

No painel do Supabase, vá em **Settings → Database → Connection string**:

```env
# URL de "Transaction pooler" (porta 6543) — para queries
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# DIRECT_URL não é mais necessário com Prisma 5 no Supabase
# Se necessário para migrations, use a URL direta (porta 5432)

# Gere com: openssl rand -base64 32
AUTH_SECRET="seu_secret_aqui"

NEXTAUTH_URL="http://localhost:3000"
```

### 4. Migrations e seed

```bash
# Gerar o cliente Prisma
npm run db:generate

# Aplicar migrations ao banco
npm run db:migrate

# Popular com dados iniciais (obrigatório para o sistema funcionar)
npm run db:seed
```

### 5. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

### Credenciais do primeiro acesso

| Usuário | E-mail | Senha | Perfil |
|---|---|---|---|
| Admin | `admin@forjapro.com.br` | `forjapro@2025` | Administrador |
| Vendedor | `carlos@forjapro.com.br` | `vendedor123` | Vendedor |

> **Importante:** Altere as senhas padrão imediatamente após o primeiro login.

---

## Deploy na Vercel

### 1. Variáveis de ambiente

No painel da Vercel, configure todas as variáveis de `.env.local`:

```
DATABASE_URL=...
AUTH_SECRET=...
NEXTAUTH_URL=https://seudominio.vercel.app
NEXT_PUBLIC_APP_URL=https://seudominio.vercel.app
```

### 2. Deploy

```bash
npx vercel --prod
```

Ou conecte o repositório GitHub na Vercel e o deploy será automático.

### 3. Migrations em produção

Após o deploy, rode as migrations e o seed via CLI da Vercel ou localmente apontando para o banco de produção:

```bash
DATABASE_URL="<url_producao>" npm run db:migrate
DATABASE_URL="<url_producao>" npm run db:seed
```

---

## Estrutura de Módulos

### Fase 1 (implementada)

| Módulo | Status | Descrição |
|---|---|---|
| Dashboard | ✅ | KPIs, leads recentes, funil |
| CRM | ✅ | Funil Kanban drag-and-drop, leads, oportunidades |
| Clientes | ✅ | CRUD completo com contatos vinculados |
| Produtos | ✅ | Catálogo TRAMA com margens e ficha técnica |
| Configurações | ✅ | Gestão de usuários e perfis RBAC |

### Fase 2 (próximas)

| Módulo | Descrição |
|---|---|
| Propostas | Geração de PDF, assinatura digital |
| Pedidos | Fluxo de aprovação, integração TRAMA |
| Estoque | Controle de entrada/saída, inventário |
| Compras | Pedidos à TRAMA, recebimento |
| Financeiro | Contas a receber/pagar, fluxo de caixa |
| Relatórios | Dashboards avançados, exportação |

---

## Perfis de Acesso (RBAC)

| Perfil | Acesso |
|---|---|
| **Administrador** | Acesso total ao sistema |
| **Gerente** | Todos os módulos exceto alteração de permissões |
| **Vendedor** | CRM, Clientes, Propostas, Pedidos, Produtos (visualização) |
| **Financeiro** | Clientes, Pedidos, Financeiro, Relatórios |
| **Estoque** | Produtos, Estoque, Compras |

---

## Comandos úteis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm run db:migrate   # Aplicar migrations
npm run db:seed      # Popular banco com dados iniciais
npm run db:studio    # Prisma Studio (GUI do banco)
npm run db:reset     # Reset completo do banco (cuidado!)
```
