"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  Layout,
  List,
  Eye,
  X,
  Move,
  Info,
} from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/admin-shell"
import { useAdminStore, type AdminArticle } from "@/components/admin/admin-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

export default function ArticlesPage() {
  const {
    ready,
    articles,
    deleteArticle,
    toggleArticleStatus,
    moveArticle,
    updateArticlePosition,
  } = useAdminStore()

  const [query, setQuery] = useState("")
  const [toDelete, setToDelete] = useState<AdminArticle | null>(null)
  const [activeTab, setActiveTab] = useState("list")

  const isFiltering = query.trim().length > 0

  // Filter and sort articles for list view
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return articles
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
    )
  }, [articles, query])

  // Get articles assigned to specific sections
  const topoArticle = useMemo(
    () => articles.find((a) => a.position === "topo" && a.status === "Publicado"),
    [articles]
  )
  const destaqueArticle = useMemo(
    () => articles.find((a) => a.position === "destaque" && a.status === "Publicado"),
    [articles]
  )
  const feedArticles = useMemo(
    () => articles.filter((a) => a.position === "feed" && a.status === "Publicado"),
    [articles]
  )
  const lateralArticles = useMemo(
    () => articles.filter((a) => a.position === "lateral" && a.status === "Publicado"),
    [articles]
  )
  const rodapeArticle = useMemo(
    () => articles.find((a) => a.position === "rodape" && a.status === "Publicado"),
    [articles]
  )

  // Unplaced or general published articles available to be positioned
  const unplacedArticles = useMemo(() => {
    return articles.filter(
      (a) =>
        a.status === "Publicado" &&
        (!a.position || a.position === "normal")
    )
  }, [articles])

  if (!ready) return null

  function confirmDelete() {
    if (toDelete) {
      deleteArticle(toDelete.id)
      toast.success("Notícia excluída.")
      setToDelete(null)
    }
  }

  function handleToggle(article: AdminArticle) {
    toggleArticleStatus(article.id)
    const next = article.status === "Publicado" ? "Rascunho" : "Publicado"
    toast.success(
      next === "Publicado"
        ? `"${article.title}" ativada.`
        : `"${article.title}" desativada.`
    )
  }

  function handleMove(id: string, direction: "up" | "down") {
    moveArticle(id, direction)
  }

  // Drag and drop handlers
  function handleDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData("text/plain", id)
  }

  function handleDrop(e: React.DragEvent, targetPosition: AdminArticle["position"]) {
    e.preventDefault()
    const id = e.dataTransfer.getData("text/plain")
    if (!id || !targetPosition) return

    updateArticlePosition(id, targetPosition)
    toast.success("Notícia posicionada com sucesso.")
  }

  return (
    <div className="p-6 lg:p-10">
      <PageHeader
        title="Notícias"
        description="Gerencie as matérias do portal e organize a ordem e posicionamento no site."
        action={
          <Link href="/admin/newNews">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova notícia
            </Button>
          </Link>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            Lista de Matérias
          </TabsTrigger>
          <TabsTrigger value="layout" className="gap-2">
            <Layout className="h-4 w-4" />
            Organizar Layout Visual
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: LIST VIEW ────────────────────────────────────────── */}
        <TabsContent value="list" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por título ou categoria"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {!isFiltering && (
            <div className="flex items-center gap-2 rounded-lg bg-accent/40 p-3 text-xs text-muted-foreground">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <span>
                Use as setas na coluna <b>Ordem</b> para reordenar a prioridade geral das notícias.
              </span>
            </div>
          )}

          <Card className="overflow-hidden border-border p-0 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  {!isFiltering && (
                    <TableHead className="w-[72px] text-center">Ordem</TableHead>
                  )}
                  <TableHead className="min-w-[280px]">Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Posição</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a, idx) => {
                  const isFirst = idx === 0
                  const isLast = idx === filtered.length - 1
                  const isActive = a.status === "Publicado"

                  return (
                    <TableRow
                      key={a.id}
                      className={!isActive ? "opacity-60" : undefined}
                    >
                      {!isFiltering && (
                        <TableCell>
                          <div className="flex flex-col items-center gap-0.5">
                            <button
                              onClick={() => handleMove(a.id, "up")}
                              disabled={isFirst}
                              className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                              aria-label="Mover para cima"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                              {idx + 1}
                            </span>
                            <button
                              onClick={() => handleMove(a.id, "down")}
                              disabled={isLast}
                              className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                              aria-label="Mover para baixo"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative h-11 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                            <Image src={a.image || "/placeholder.svg"} alt="" fill className="object-cover" sizes="64px" />
                          </div>
                          <div className="flex min-w-0 flex-col">
                            <span className="line-clamp-2 text-sm font-medium text-foreground">
                              {a.title}
                            </span>
                            {a.urgent && (
                              <span className="mt-0.5 w-fit text-[9px] font-semibold uppercase text-destructive">
                                Urgente
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{a.category}</span>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={a.position || "normal"}
                          onValueChange={(val) => {
                            updateArticlePosition(a.id, val as any)
                            toast.success("Posição de layout atualizada.")
                          }}
                        >
                          <SelectTrigger className="h-8 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Geral / Nenhuma</SelectItem>
                            <SelectItem value="topo">Faixa Superior</SelectItem>
                            <SelectItem value="destaque">Destaque Principal</SelectItem>
                            <SelectItem value="feed">Feed Central</SelectItem>
                            <SelectItem value="lateral">Barra Lateral</SelectItem>
                            <SelectItem value="rodape">Rodapé</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center gap-1.5">
                          <Switch
                            checked={isActive}
                            onCheckedChange={() => handleToggle(a)}
                            aria-label={isActive ? "Desativar" : "Ativar"}
                          />
                          <Badge
                            variant={isActive ? "default" : "secondary"}
                            className={
                              isActive
                                ? "bg-secondary text-secondary-foreground text-[10px]"
                                : "text-[10px]"
                            }
                          >
                            {a.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/newNews?edit=${a.id}`}>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setToDelete(a)}
                            aria-label="Excluir"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isFiltering ? 5 : 6} className="py-10 text-center text-sm text-muted-foreground">
                      Nenhuma notícia encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ─── TAB 2: VISUAL LAYOUT EDITOR ─────────────────────────────── */}
        <TabsContent value="layout" className="mt-4">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* Sidebar of unplaced/placed draggable items */}
            <div className="flex flex-col gap-4 xl:col-span-1">
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="font-serif text-lg font-bold text-foreground">
                  Matérias Disponíveis
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Arraste os cards publicados para os blocos correspondentes do layout ou altere sua posição usando o menu seletor em cada card.
                </p>

                <div className="mt-4 space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {unplacedArticles.length === 0 && (
                    <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground bg-muted/20">
                      Nenhuma matéria geral disponível. Mova matérias já posicionadas de volta para &quot;Geral&quot; ou publique novas notícias.
                    </div>
                  )}

                  {unplacedArticles.map((a) => (
                    <div
                      key={a.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, a.id)}
                      className="group relative flex cursor-grab items-start gap-3 rounded-lg border border-border bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md active:cursor-grabbing"
                    >
                      <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 rounded bg-primary/10 px-1 py-0.5 text-[10px] text-primary">
                        <Move className="h-3 w-3" /> Arrastar
                      </div>
                      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded bg-muted">
                        <Image src={a.image || "/placeholder.svg"} alt="" fill className="object-cover" sizes="80px" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <p className="line-clamp-2 text-xs font-semibold leading-tight text-foreground pr-4">
                          {a.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="h-4 px-1 text-[9px]">
                            {a.category}
                          </Badge>
                          <Select
                            value={a.position || "normal"}
                            onValueChange={(val) => {
                              updateArticlePosition(a.id, val as any)
                              toast.success("Posição alterada")
                            }}
                          >
                            <SelectTrigger className="h-5 w-24 px-1 text-[9px] bg-background">
                              <SelectValue placeholder="Mover..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">Geral</SelectItem>
                              <SelectItem value="topo">Faixa Superior</SelectItem>
                              <SelectItem value="destaque">Destaque</SelectItem>
                              <SelectItem value="feed">Feed Central</SelectItem>
                              <SelectItem value="lateral">Barra Lateral</SelectItem>
                              <SelectItem value="rodape">Rodapé</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Portal Layout Representation (Drop zones) */}
            <div className="space-y-4 xl:col-span-2">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-4 flex items-center justify-between border-b pb-3">
                  <h3 className="font-serif text-lg font-bold text-foreground">
                    Mockup do Portal Notícias
                  </h3>
                  <Badge variant="outline" className="bg-primary/5 text-primary text-xs py-0.5 px-2">
                    Visualizador Interativo
                  </Badge>
                </div>

                {/* INTERACTIVE MOCKUP PORTAL */}
                <div className="rounded-xl border border-border bg-slate-50/50 p-4 dark:bg-zinc-950/20 space-y-4">
                  
                  {/* Browser chrome header bar */}
                  <div className="flex items-center justify-between rounded bg-muted/80 px-3 py-1.5 text-xs text-muted-foreground font-mono">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-destructive" />
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    <span>senadorcanedohoje.com.br</span>
                    <span className="w-10 text-right opacity-30">Menu</span>
                  </div>

                  {/* Header Logo */}
                  <div className="border-b pb-4 pt-2 text-center">
                    <h1 className="font-serif text-2xl font-black tracking-tight text-primary">
                      SENADOR CANEDO HOJE
                    </h1>
                    <p className="text-[10px] text-muted-foreground font-sans tracking-widest uppercase">
                      Jornalismo Local e em Tempo Real
                    </p>
                  </div>

                  {/* DROPZONE: TOPO (FAIXA SUPERIOR) */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, "topo")}
                    className={`relative rounded-md border-2 border-dashed p-3 transition-colors ${
                      topoArticle
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <div className="absolute left-2 top-2 rounded bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground uppercase">
                      Faixa Superior (Leaderboard)
                    </div>
                    {topoArticle ? (
                      <div className="mt-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded bg-muted">
                            <Image src={topoArticle.image} alt="" fill className="object-cover" sizes="64px" />
                          </div>
                          <div>
                            <p className="line-clamp-1 text-sm font-bold text-foreground">
                              {topoArticle.title}
                            </p>
                            <span className="text-[10px] text-muted-foreground font-medium">
                              Categoria: {topoArticle.category} · {topoArticle.author}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => updateArticlePosition(topoArticle.id, "normal")}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          aria-label="Remover"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-1">
                        <Move className="h-5 w-5 opacity-40" />
                        <span>Arraste um card aqui para fixá-lo na faixa superior</span>
                      </div>
                    )}
                  </div>

                  {/* DROPZONE: DESTAQUE PRINCIPAL */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, "destaque")}
                    className={`relative rounded-lg border-2 border-dashed p-4 transition-colors ${
                      destaqueArticle
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <div className="absolute left-2 top-2 z-10 rounded bg-primary text-primary-foreground px-1.5 py-0.5 text-[9px] font-bold uppercase">
                      Destaque Principal
                    </div>
                    {destaqueArticle ? (
                      <div className="mt-4 space-y-3">
                        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-md bg-muted">
                          <Image src={destaqueArticle.image} alt="" fill className="object-cover" sizes="600px" />
                          <div className="absolute bottom-2 right-2 flex gap-1">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 px-2.5 text-xs gap-1"
                              onClick={() => updateArticlePosition(destaqueArticle.id, "normal")}
                            >
                              <X className="h-3 w-3" /> Remover
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-primary hover:bg-primary/95 text-[10px] h-4">
                              {destaqueArticle.category}
                            </Badge>
                            {destaqueArticle.urgent && (
                              <Badge variant="destructive" className="text-[10px] h-4">
                                URGENTE
                              </Badge>
                            )}
                          </div>
                          <h2 className="font-serif text-lg font-black text-foreground">
                            {destaqueArticle.title}
                          </h2>
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {destaqueArticle.excerpt}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="py-14 text-center text-xs text-muted-foreground flex flex-col items-center gap-1.5">
                        <Move className="h-6 w-6 opacity-45" />
                        <span className="font-medium">Bloco de Manchete Principal</span>
                        <span className="text-[11px] opacity-75">Arraste a notícia mais importante do dia para cá</span>
                      </div>
                    )}
                  </div>

                  {/* SECTION ROW: LEFT FEED CENTRAL & RIGHT BARRA LATERAL */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* DROPZONE: FEED CENTRAL */}
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, "feed")}
                      className="md:col-span-2 relative rounded-lg border-2 border-dashed border-border p-4 transition-colors hover:border-primary/40 bg-background/50 space-y-3"
                    >
                      <div className="absolute left-2 top-2 rounded bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground uppercase">
                        Feed Central ({feedArticles.length})
                      </div>
                      
                      <div className="pt-6 space-y-3 min-h-[160px]">
                        {feedArticles.length === 0 ? (
                          <div className="py-10 text-center text-xs text-muted-foreground flex flex-col items-center gap-1">
                            <Move className="h-5 w-5 opacity-40" />
                            <span>Arraste múltiplos cards aqui para preencher o feed principal</span>
                          </div>
                        ) : (
                          feedArticles.map((art) => (
                            <div
                              key={art.id}
                              className="flex items-center justify-between gap-3 p-2 rounded-md border bg-card/80 shadow-xs hover:border-primary/30"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded bg-muted">
                                  <Image src={art.image} alt="" fill className="object-cover" sizes="56px" />
                                </div>
                                <div className="min-w-0">
                                  <p className="line-clamp-1 text-xs font-bold text-foreground">
                                    {art.title}
                                  </p>
                                  <span className="text-[9px] text-muted-foreground">
                                    {art.category} · Por {art.author}
                                  </span>
                                </div>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => updateArticlePosition(art.id, "normal")}
                                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* DROPZONE: BARRA LATERAL */}
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, "lateral")}
                      className="relative rounded-lg border-2 border-dashed border-border p-4 transition-colors hover:border-primary/40 bg-background/50 space-y-3"
                    >
                      <div className="absolute left-2 top-2 rounded bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground uppercase">
                        Barra Lateral ({lateralArticles.length})
                      </div>
                      
                      <div className="pt-6 space-y-3 min-h-[160px]">
                        {lateralArticles.length === 0 ? (
                          <div className="py-10 text-center text-xs text-muted-foreground flex flex-col items-center gap-1">
                            <Move className="h-5 w-5 opacity-40" />
                            <span>Arraste múltiplos cards aqui para a barra lateral</span>
                          </div>
                        ) : (
                          lateralArticles.map((art) => (
                            <div
                              key={art.id}
                              className="flex flex-col gap-1.5 p-2 rounded-md border bg-card/80 shadow-xs hover:border-primary/30"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[9px] font-bold text-secondary uppercase">
                                  {art.category}
                                </span>
                                <button
                                  onClick={() => updateArticlePosition(art.id, "normal")}
                                  className="text-muted-foreground hover:text-destructive rounded hover:bg-muted p-0.5"
                                  aria-label="Remover"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                              <p className="line-clamp-2 text-xs font-bold leading-tight text-foreground">
                                {art.title}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>

                  {/* DROPZONE: RODAPÉ */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, "rodape")}
                    className={`relative rounded-md border-2 border-dashed p-3 transition-colors ${
                      rodapeArticle
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <div className="absolute left-2 top-2 rounded bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground uppercase">
                      Rodapé (Seção Inferior)
                    </div>
                    {rodapeArticle ? (
                      <div className="mt-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded bg-muted">
                            <Image src={rodapeArticle.image} alt="" fill className="object-cover" sizes="64px" />
                          </div>
                          <div>
                            <p className="line-clamp-1 text-sm font-bold text-foreground">
                              {rodapeArticle.title}
                            </p>
                            <span className="text-[10px] text-muted-foreground font-medium">
                              Categoria: {rodapeArticle.category} · Por {rodapeArticle.author}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => updateArticlePosition(rodapeArticle.id, "normal")}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          aria-label="Remover"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-1">
                        <Move className="h-5 w-5 opacity-40" />
                        <span>Arraste um card aqui para posicioná-lo no rodapé</span>
                      </div>
                    )}
                  </div>

                  {/* Mock Footer */}
                  <div className="rounded bg-muted/50 p-2 text-center text-[10px] text-muted-foreground">
                    © 2026 Senador Canedo Hoje. Todos os direitos reservados.
                  </div>

                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir notícia?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A matéria &quot;{toDelete?.title}&quot; será
              removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
