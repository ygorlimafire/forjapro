"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { getOpportunityDetail, getUsers, updateOpportunityNotes, deleteOpportunity } from "@/actions/crm"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AddActivityDialog } from "./add-activity-dialog"
import { EditOpportunityDialog } from "./edit-opportunity-dialog"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  X,
  Loader2,
  Trash2,
  Building2,
  Phone,
  Mail,
  Users,
  User,
  MapPin,
  MessageCircle,
  CheckSquare,
  FileText,
  PhoneCall,
  FileSignature,
  ShoppingCart,
} from "lucide-react"

type OpportunityDetail = NonNullable<Awaited<ReturnType<typeof getOpportunityDetail>>>

const activityConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  LIGACAO:  { label: "Ligação",   icon: PhoneCall,       color: "text-blue-500" },
  EMAIL:    { label: "E-mail",    icon: Mail,            color: "text-purple-500" },
  REUNIAO:  { label: "Reunião",   icon: Users,           color: "text-green-500" },
  VISITA:   { label: "Visita",    icon: MapPin,          color: "text-orange-500" },
  WHATSAPP: { label: "WhatsApp",  icon: MessageCircle,   color: "text-emerald-500" },
  TAREFA:   { label: "Tarefa",    icon: CheckSquare,     color: "text-yellow-600" },
  NOTA:     { label: "Nota",      icon: FileText,        color: "text-muted-foreground" },
}

const proposalStatusConfig: Record<string, { label: string; className: string }> = {
  RASCUNHO:      { label: "Rascunho",      className: "bg-muted text-muted-foreground" },
  ENVIADA:       { label: "Enviada",       className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  EM_NEGOCIACAO: { label: "Em negociação", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  APROVADA:      { label: "Aprovada",      className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  RECUSADA:      { label: "Recusada",      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  VENCIDA:       { label: "Vencida",       className: "bg-muted text-muted-foreground" },
  CANCELADA:     { label: "Cancelada",     className: "bg-muted text-muted-foreground" },
}

const orderStatusConfig: Record<string, { label: string; className: string }> = {
  PENDENTE:               { label: "Pendente",          className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  CONFIRMADO:             { label: "Confirmado",         className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  AGUARDANDO_EXPEDICAO:   { label: "Ag. Expedição",     className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  ENTREGUE:               { label: "Entregue",           className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  CANCELADO:              { label: "Cancelado",          className: "bg-muted text-muted-foreground" },
}

interface Props {
  opportunityId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  canDelete?: boolean
}

export function OpportunityDrawer({ opportunityId, open, onOpenChange, canDelete = false }: Props) {
  const router = useRouter()
  const [detail, setDetail] = useState<OpportunityDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [notesValue, setNotesValue] = useState("")
  const [notesSaving, setNotesSaving] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    getUsers().then(setUsers)
  }, [])

  useEffect(() => {
    if (!open || !opportunityId) return
    setLoading(true)
    setDetail(null)
    getOpportunityDetail(opportunityId)
      .then((data) => {
        setDetail(data)
        setNotesValue(data?.notes ?? "")
      })
      .finally(() => setLoading(false))
  }, [opportunityId, open])

  async function refresh() {
    if (!opportunityId) return
    const data = await getOpportunityDetail(opportunityId)
    setDetail(data)
    router.refresh()
  }

  async function handleDelete() {
    if (!opportunityId) return
    setDeleting(true)
    const result = await deleteOpportunity(opportunityId)
    setDeleting(false)
    setDeleteConfirmOpen(false)
    if (result.success) {
      toast.success("Oportunidade excluída")
      onOpenChange(false)
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  async function saveNotes() {
    if (!opportunityId) return
    setNotesSaving(true)
    const result = await updateOpportunityNotes(opportunityId, notesValue)
    setNotesSaving(false)
    if (result.success) {
      toast.success("Observações salvas")
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-lg p-0 gap-0 flex flex-col"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b shrink-0">
          <div className="flex-1 min-w-0">
            {detail && (
              <div className="flex items-center gap-1.5 mb-1">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: detail.stage.color }}
                />
                <span className="text-xs text-muted-foreground">{detail.stage.name}</span>
              </div>
            )}
            <SheetTitle className="text-base font-semibold leading-snug">
              {detail?.title ?? (loading ? "Carregando..." : "—")}
            </SheetTitle>
            {detail?.assignee && (
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <User size={10} />
                {detail.assignee.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {detail && (
              <EditOpportunityDialog
                opportunity={{
                  id: detail.id,
                  title: detail.title,
                  assignee: detail.assignee,
                  value: detail.value ? Number(detail.value) : null,
                  probability: detail.probability,
                  expectedClose: detail.expectedClose,
                }}
                users={users}
                onSuccess={refresh}
              />
            )}
            {detail && canDelete && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <Trash2 size={16} />
                <span className="sr-only">Excluir oportunidade</span>
              </Button>
            )}
            <SheetClose
              render={
                <Button variant="ghost" size="icon-sm" />
              }
            >
              <X size={16} />
              <span className="sr-only">Fechar</span>
            </SheetClose>
          </div>
        </div>

        {/* Body */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && !detail && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Oportunidade não encontrada</p>
          </div>
        )}

        {!loading && detail && (
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Cliente */}
            <div className="px-6 py-4 border-b">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Cliente</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">
                    {detail.customer.tradeName || detail.customer.companyName || "—"}
                  </span>
                </div>
                {detail.customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-muted-foreground shrink-0" />
                    <span className="text-sm">{detail.customer.phone}</span>
                  </div>
                )}
                {detail.customer.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-muted-foreground shrink-0" />
                    <span className="text-sm">{detail.customer.email}</span>
                  </div>
                )}
              </div>

              {detail.customer.contacts.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Contatos</p>
                  {detail.customer.contacts.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <User size={12} className="text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <span className="font-medium">{c.name}</span>
                        {c.role && <span className="text-muted-foreground"> · {c.role}</span>}
                        {c.phone && <p className="text-muted-foreground text-xs">{c.phone}</p>}
                        {c.email && <p className="text-muted-foreground text-xs">{c.email}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="atividades">
              <TabsList className="mx-6 mt-4 mb-0 w-auto" variant="line">
                <TabsTrigger value="atividades">
                  Atividades
                  {detail.activities.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                      {detail.activities.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="propostas">
                  Propostas
                  {detail.proposals.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                      {detail.proposals.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="observacoes">Observações</TabsTrigger>
              </TabsList>

              {/* Atividades */}
              <TabsContent value="atividades" className="px-6 pt-4 pb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground font-medium">
                    {detail.activities.length === 0 ? "Nenhuma atividade" : `${detail.activities.length} atividade${detail.activities.length > 1 ? "s" : ""}`}
                  </p>
                  <AddActivityDialog opportunityId={detail.id} onSuccess={refresh} />
                </div>

                {detail.activities.length === 0 ? (
                  <div className="py-8 text-center">
                    <PhoneCall size={28} className="mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhuma atividade registrada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {detail.activities.map((activity) => {
                      const config = activityConfig[activity.type] ?? activityConfig.NOTA
                      const Icon = config.icon
                      return (
                        <div key={activity.id} className="flex items-start gap-3">
                          <div className={`mt-0.5 shrink-0 ${config.color}`}>
                            <Icon size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-tight">{activity.title}</p>
                            {activity.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {activity.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {config.label} · {activity.user.name} · {formatDate(activity.createdAt)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Propostas */}
              <TabsContent value="propostas" className="px-6 pt-4 pb-6">
                {detail.proposals.length === 0 ? (
                  <div className="py-8 text-center">
                    <FileSignature size={28} className="mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhuma proposta vinculada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {detail.proposals.map((proposal) => {
                      const pStatus = proposalStatusConfig[proposal.status] ?? proposalStatusConfig.RASCUNHO
                      return (
                        <div key={proposal.id} className="rounded-lg border p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <FileSignature size={13} className="text-muted-foreground shrink-0" />
                              <span className="text-sm font-medium">Proposta {proposal.number}</span>
                            </div>
                            <span
                              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${pStatus.className}`}
                            >
                              {pStatus.label}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{formatCurrency(Number(proposal.totalAmount))}</span>
                            <span>{formatDate(proposal.createdAt)}</span>
                          </div>
                          {proposal.order && (
                            <div className="flex items-center gap-2 pt-1 border-t">
                              <ShoppingCart size={11} className="text-muted-foreground shrink-0" />
                              <span className="text-xs text-muted-foreground">Pedido:</span>
                              <span
                                className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
                                  (orderStatusConfig[proposal.order.status] ?? orderStatusConfig.PENDENTE).className
                                }`}
                              >
                                {(orderStatusConfig[proposal.order.status] ?? orderStatusConfig.PENDENTE).label}
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Observações */}
              <TabsContent value="observacoes" className="px-6 pt-4 pb-6">
                <div className="space-y-3">
                  <Textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    placeholder="Adicione observações sobre esta oportunidade..."
                    rows={6}
                    className="resize-none"
                  />
                  <Button
                    onClick={saveNotes}
                    disabled={notesSaving}
                    size="sm"
                  >
                    {notesSaving && <Loader2 size={13} className="animate-spin" />}
                    {notesSaving ? "Salvando..." : "Salvar observações"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>

    <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir oportunidade?</AlertDialogTitle>
          <AlertDialogDescription>
            A oportunidade <strong>&quot;{detail?.title}&quot;</strong> será marcada como excluída. Atividades e propostas vinculadas são preservadas no histórico.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
