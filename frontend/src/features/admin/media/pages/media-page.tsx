"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Copy, FileText, Film, Image as ImageIcon, LayoutGrid, List, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/admin-shell"
import { useAdminStore, type Media } from "@/components/admin/admin-store"
import { MediaDialog, type MediaFormValues } from "@/features/admin/media/components/media-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

export default function MediaPage() {
  const { ready, media, addMedia, updateMedia, deleteMedia } = useAdminStore()

  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video" | "document">("all")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Media | null>(null)
  const [toDelete, setToDelete] = useState<Media | null>(null)

  const filteredMedia = useMemo(() => {
    return media.filter((m) => {
      const matchesSearch =
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.alt?.toLowerCase().includes(search.toLowerCase()) ||
        m.url.toLowerCase().includes(search.toLowerCase())

      if (!matchesSearch) return false

      if (typeFilter !== "all") return m.type === typeFilter
      return true
    })
  }, [media, search, typeFilter])

  if (!ready) return null

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(item: Media) {
    setEditing(item)
    setFormOpen(true)
  }

  function handleSubmit(values: MediaFormValues) {
    if (editing) {
      updateMedia(editing.id, values)
      toast.success(`Mídia "${values.title}" atualizada.`)
    } else {
      addMedia(values)
      toast.success(`Mídia "${values.title}" salva na biblioteca.`)
    }
  }

  function confirmDelete() {
    if (toDelete) {
      deleteMedia(toDelete.id)
      toast.success(`Mídia "${toDelete.title}" excluída.`)
      setToDelete(null)
    }
  }

  function copyUrl(url: string) {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(url)
      toast.success("URL da mídia copiada para a área de transferência!")
    }
  }

  return (
    <div className="p-6 lg:p-10 space-y-6">
      <PageHeader
        title="Biblioteca de Mídias"
        description="Gerencie fotos, vídeos e documentos anexados às reportagens do portal."
        action={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar mídia
          </Button>
        }
      />

      {/* Filters, search, and view mode toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-xl border border-border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, texto alt ou URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Type filters */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
            <button
              onClick={() => setTypeFilter("all")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                typeFilter === "all"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Todas ({media.length})
            </button>
            <button
              onClick={() => setTypeFilter("image")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                typeFilter === "image"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Imagens ({media.filter((m) => m.type === "image").length})
            </button>
            <button
              onClick={() => setTypeFilter("video")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                typeFilter === "video"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Vídeos ({media.filter((m) => m.type === "video").length})
            </button>
          </div>

          {/* Grid vs Table toggle */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "grid" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
              }`}
              aria-label="Visualização em Grid"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "table" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
              }`}
              aria-label="Visualização em Tabela"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {filteredMedia.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground opacity-50 mb-3" />
          <p className="text-base font-medium text-foreground">Nenhuma mídia encontrada</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tente ajustar os filtros ou adicione uma nova mídia.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid Gallery View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredMedia.map((item) => (
            <Card key={item.id} className="overflow-hidden border-border bg-card shadow-xs group flex flex-col justify-between">
              <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                {item.type === "image" || item.type === "video" ? (
                  <Image
                    src={item.url || "/placeholder.svg"}
                    alt={item.alt || item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="300px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted/60 text-muted-foreground">
                    <FileText className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
                  <Badge variant="secondary" className="bg-background/90 text-foreground backdrop-blur-xs text-[10px] font-semibold">
                    {item.type === "image" && <ImageIcon className="h-3 w-3 mr-1 text-blue-500" />}
                    {item.type === "video" && <Film className="h-3 w-3 mr-1 text-amber-500" />}
                    {item.type === "document" && <FileText className="h-3 w-3 mr-1 text-purple-500" />}
                    {item.type.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-4 flex-1 space-y-1">
                <h3 className="font-serif font-bold text-sm text-foreground line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1 font-mono">
                  {item.url}
                </p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground font-medium">
                  <span>{item.size}</span>
                  {item.dimensions && <span>• {item.dimensions}</span>}
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t border-border p-2.5 px-4 bg-muted/20">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => copyUrl(item.url)}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copiar URL
                </Button>

                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(item)} aria-label="Editar">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setToDelete(item)}
                    aria-label="Excluir"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[80px]">Prévia</TableHead>
                <TableHead>Título & URL</TableHead>
                <TableHead className="text-center">Tipo</TableHead>
                <TableHead className="text-center">Tamanho</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMedia.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="relative h-12 w-16 rounded-md bg-muted overflow-hidden border border-border">
                      {item.type === "image" || item.type === "video" ? (
                        <Image src={item.url} alt={item.title} fill className="object-cover" sizes="64px" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <FileText className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-sm text-foreground">{item.title}</div>
                    <div className="text-xs font-mono text-muted-foreground truncate max-w-xs">{item.url}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-xs uppercase">
                      {item.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-xs font-mono text-muted-foreground">
                    {item.size}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyUrl(item.url)}
                        className="gap-1 text-xs"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copiar
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(item)} aria-label="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setToDelete(item)}
                        aria-label="Excluir"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Media Edit/Create Dialog */}
      <MediaDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir mídia &quot;{toDelete?.title}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta mídia será removida da biblioteca do portal.
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
