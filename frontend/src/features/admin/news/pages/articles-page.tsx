"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Search,
  Trash2,
  Info,
} from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/admin-shell"
import { useNews } from "@/features/admin/news/hooks/use-news"
import { useUpdateNews } from "@/features/admin/news/hooks/use-update-news"
import { useDeleteNews } from "@/features/admin/news/hooks/use-delete-news"
import { useUpdateNewsPosition, type NewsPatch } from "@/features/admin/news/hooks/use-update-news-position"
import {
  buildNewsConfig,
  newsToRow,
  readPositionOrder,
  type NewsPosition,
  type NewsRow,
} from "@/features/admin/news/types/news"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
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
import { assetPath } from "@/lib/utils"

// Ordem de exibição das posições no painel. Feed Central e Barra Lateral são
// os únicos que aceitam várias matérias e respeitam a ordem manual (positionOrder).
const POSITION_RANK: Record<string, number> = {
  normal: 0,
  topo: 1,
  destaque: 2,
  feed: 3,
  lateral: 4,
  rodape: 5,
}

const POSITION_ITEMS: { value: NewsPosition; label: string }[] = [
  { value: "normal", label: "Geral / Nenhuma" },
  { value: "topo", label: "Faixa Superior" },
  { value: "destaque", label: "Destaque Principal" },
  { value: "feed", label: "Feed Central" },
  { value: "lateral", label: "Barra Lateral" },
  { value: "rodape", label: "Rodapé" },
]

export default function ArticlesPage() {
  const { data, isLoading } = useNews({ limit: 50 })
  const updateNews = useUpdateNews()
  const deleteNews = useDeleteNews()
  const updatePosition = useUpdateNewsPosition()

  const rows = useMemo(() => (data?.data ?? []).map(newsToRow), [data])

  const [query, setQuery] = useState("")
  const [toDelete, setToDelete] = useState<NewsRow | null>(null)

  const isFiltering = query.trim().length > 0

  // Filter and sort articles for list view
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = q
      ? rows.filter(
          (a) =>
            a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
        )
      : rows

    return [...base].sort((a, b) => {
      const rankA = POSITION_RANK[a.position] ?? 0
      const rankB = POSITION_RANK[b.position] ?? 0
      if (rankA !== rankB) return rankA - rankB

      // Dentro de feed/lateral, respeita a ordem manual escolhida pelas setas.
      if (a.position === "feed" || a.position === "lateral") {
        const orderDiff = readPositionOrder(a.config) - readPositionOrder(b.config)
        if (orderDiff !== 0) return orderDiff
      }

      // Desempate: mais recente primeiro.
      return Date.parse(b.createdAt) - Date.parse(a.createdAt)
    })
  }, [rows, query])

  if (isLoading) return null

  /* ─── Position handlers ─────────────────────────────────────────── */

  function handlePositionChange(id: string, position: NewsPosition) {
    const target = rows.find((r) => r.id === id)
    if (!target || target.position === position) return

    const patches: NewsPatch[] = []

    // Slots exclusivos (destaque, topo, rodape): rebaixa o ocupante atual.
    const exclusive: NewsPosition[] = ["destaque", "topo", "rodape"]
    if (exclusive.includes(position)) {
      rows.forEach((r) => {
        if (r.position === position && r.id !== id) {
          patches.push({
            id: r.id,
            payload: { config: buildNewsConfig(r.config, "normal") },
          })
        }
      })
    }

    const config = buildNewsConfig(target.config, position)
    if (position === "feed" || position === "lateral") {
      const slotOrders = rows
        .filter((r) => r.position === position && r.id !== id)
        .map((r) => readPositionOrder(r.config))
      config.positionOrder = slotOrders.length ? Math.max(...slotOrders) + 1 : 0
    }
    patches.push({ id, payload: { config } })

    updatePosition.mutate(patches, {
      onSuccess: () => {
        toast.success(
          position === "normal"
            ? "Notícia movida para o acervo."
            : "Posição de layout atualizada."
        )
      },
      onError: () => {
        toast.error("Não foi possível atualizar a posição.")
      },
    })
  }

  function handleMove(id: string, direction: "up" | "down") {
    const row = rows.find((r) => r.id === id)
    if (!row) return

    if (row.position !== "feed" && row.position !== "lateral") {
      toast.info("Reordenação manual vale apenas para os slots Feed Central e Barra Lateral.")
      return
    }

    // Ordem atual do slot (positionOrder; desempate por data). Muitas matérias
    // chegam com positionOrder duplicado/0, então apenas trocar dois valores
    // não produzia mudança visível — por isso a sequência é reemitida contígua.
    const slot = rows
      .filter((r) => r.position === row.position)
      .sort(
        (a, b) =>
          readPositionOrder(a.config) - readPositionOrder(b.config) ||
          Date.parse(b.createdAt) - Date.parse(a.createdAt)
      )
    const idx = slot.findIndex((r) => r.id === id)
    const swapIdx = direction === "up" ? idx - 1 : idx + 1
    if (idx < 0 || swapIdx < 0 || swapIdx >= slot.length) return

    const reordered = [...slot]
    const [moved] = reordered.splice(idx, 1)
    reordered.splice(swapIdx, 0, moved)

    // Renumera o slot inteiro (0..n-1) na nova ordem e grava tudo.
    const patches: NewsPatch[] = reordered.map((r, i) => ({
      id: r.id,
      payload: { config: { ...r.config, position: r.position, positionOrder: i } },
    }))

    updatePosition.mutate(patches, {
      onSuccess: () => toast.success("Ordem atualizada."),
      onError: () => toast.error("Não foi possível reordenar."),
    })
  }


  function confirmDelete() {
    if (toDelete) {
      deleteNews.mutate(toDelete.id, {
        onSuccess: () => {
          toast.success(`Notícia "${toDelete.title}" arquivada.`)
          setToDelete(null)
        },
        onError: () => {
          toast.error("Não foi possível arquivar a notícia.")
        },
      })
    }
  }

  function handleToggle(row: NewsRow) {
    const next = row.status === "Publicado" ? "draft" : "published"
    updateNews.mutate(
      { id: row.id, payload: { status: next } },
      {
        onSuccess: () => {
          toast.success(
            next === "published"
              ? `"${row.title}" ativada.`
              : `"${row.title}" desativada.`
          )
        },
        onError: () => {
          toast.error("Não foi possível alterar o status.")
        },
      }
    )
  }

  return (
    <div className="p-6 lg:p-10">
      <PageHeader
        title="Notícias"
        description="Gerencie as matérias do portal."
        action={
          <Link href="/admin/newNews">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova notícia
            </Button>
          </Link>
        }
      />

      <div className="mt-6 space-y-4">
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
              Use as setas na coluna <b>Ordem</b> para reordenar o feed central e a barra lateral.
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
                // Reordenação manual vale apenas para Feed Central e Barra Lateral.
                const canReorder = a.position === "feed" || a.position === "lateral"

                // Posição do item dentro do seu próprio bloco (para setas).
                const slot = filtered.filter((r) => r.position === a.position)
                const slotIdx = slot.findIndex((r) => r.id === a.id)
                const isSlotFirst = slotIdx === 0
                const isSlotLast = slotIdx === slot.length - 1

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
                            disabled={!canReorder || isSlotFirst}
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
                            disabled={!canReorder || isSlotLast}
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
                          <img
                            src={assetPath(a?.image || "/placeholder.svg")}
                            alt=""
                            className="h-full w-full object-cover"
                          />
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
                        items={POSITION_ITEMS}
                        onValueChange={(val) => {
                          handlePositionChange(a.id, val as NewsPosition)
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
                        <Link href={`/admin/newNews?edit=${a.slug}`}>
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
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar notícia?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação arquiva a matéria &quot;{toDelete?.title}&quot;: ela sai do ar
              nas rotas públicas, mas continua disponível no painel e pode ser
              republicada a qualquer momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
