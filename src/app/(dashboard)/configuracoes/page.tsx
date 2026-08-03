import { Metadata } from "next"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { can } from "@/lib/rbac"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Settings, Users, Shield, Plus, Tag, Layers } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { UserActions } from "@/components/shared/user-actions"
import { ExpenseCategoriesPanel } from "@/components/financial/expense-categories-panel"
import { ProductCategoriesPanel } from "@/components/products/product-categories-panel"
import { getAllCategories } from "@/actions/products"

export const metadata: Metadata = { title: "Configurações" }

export default async function ConfiguracoesPage() {
  const session = await auth()
  if (!session?.user || !can(session.user.permissions, "configuracoes", "view")) {
    redirect("/dashboard")
  }

  const [users, roles, expenseCategories, productCategories] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null },
      include: { role: true },
      orderBy: { name: "asc" },
    }),
    prisma.role.findMany({
      include: { _count: { select: { users: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.expenseCategory.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] }),
    getAllCategories(),
  ])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings size={22} /> Configurações
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie usuários, perfis e configurações do sistema
        </p>
      </div>

      {/* Usuários */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Users size={16} /> Usuários
              </CardTitle>
              <CardDescription>Gerencie os acessos da equipe</CardDescription>
            </div>
            <Link href="/configuracoes/usuarios/novo">
              <Button size="sm">
                <Plus size={14} />
                Novo usuário
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-3 px-2 font-medium">Nome</th>
                  <th className="text-left py-3 px-2 font-medium">E-mail</th>
                  <th className="text-left py-3 px-2 font-medium">Perfil</th>
                  <th className="text-left py-3 px-2 font-medium">Status</th>
                  <th className="text-left py-3 px-2 font-medium hidden md:table-cell">Desde</th>
                  <th className="py-3 px-2" />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-2 font-medium">{user.name}</td>
                    <td className="py-3 px-2 text-muted-foreground">{user.email}</td>
                    <td className="py-3 px-2">
                      <Badge variant="outline">{user.role.label}</Badge>
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-muted-foreground hidden md:table-cell">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="py-3 px-2">
                      <UserActions userId={user.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Perfis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield size={16} /> Perfis de Acesso
          </CardTitle>
          <CardDescription>Papéis e permissões do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <div key={role.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{role.label}</p>
                  <Badge variant="secondary">{role._count.users} usuário(s)</Badge>
                </div>
                {role.description && (
                  <p className="text-xs text-muted-foreground">{role.description}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Categorias de Despesa */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tag size={16} /> Categorias de Despesa
          </CardTitle>
          <CardDescription>Organize as contas a pagar por categorias com cores</CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseCategoriesPanel categories={expenseCategories} />
        </CardContent>
      </Card>

      {/* Categorias de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Layers size={16} /> Categorias de Produtos
          </CardTitle>
          <CardDescription>
            Organize o catálogo por categoria — defina nome, descrição e ordem de exibição
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductCategoriesPanel categories={productCategories} />
        </CardContent>
      </Card>
    </div>
  )
}
