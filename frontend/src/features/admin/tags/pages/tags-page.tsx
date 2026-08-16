"use client"

import { useMemo, useState } from "react"
import { Hash, Pencil, Plus, Search, Tag as TagIcon, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/admin-shell"
import { useAdminStore, type Tag } from "@/components/admin/admin-store"
import { TagDialog, type TagFormValues } from "@/features/admin/tags/components/tag-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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

export default function TagsPage() {
  const { ready, tags, addTag, updateTag, deleteTag } = useAdminStore()

  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Tag | null>(null)
  const [toDelete, setToDelete] = useState<Tag | null>(null)

  const filteredTags = useMemo(() => {
    return tags.filter(
      (t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.slug.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase())
    )
  }, [tags, search])

  if (!ready) return null

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(tag: Tag) {
    setEditing(tag)
    setFormOpen(true)
  }

  function handleSubmit(values: TagFormValues) {
    if (editing) {
      updateTag(editing.id, values)
      toast.success(`Tag "${values.name}" atualizada.`)
    } else {
      addTag(values)
      toast.success(`Tag "${values.name}" criada.`)
    }
  }

  function confirmDelete() {
    if (toDelete) {
      deleteTag(toDelete.id)
      toast.success(`Tag "${toDelete.name}" excluída.`)
      setToDelete(null)
    }
  }

  return (
    <div className="p-6 lg:p-10 space-y-6">
      <PageHeader
        title="Tags & Palavras-Chave"
        description="Gerencie as etiquetas utilizadas para marcar temas específicos de notícias."
        action={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova tag
          </Button>
        }
      />

      {/* Cloud preview of tags */}
      <div className="bg-card p-5 rounded-xl border border-border space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <TagIcon className="h-3.5 w-3.5" />
          <span>Nuvem de Tags no Portal</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => openEdit(tag)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105 border border-border"
              style={{ backgroundColor: `${tag.color}15`, color: tag.color, borderColor: `${tag.color}40` }}
            >
              <Hash className="h-3 w-3" />
              <span>{tag.name}</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-background/80 font-mono font-bold">
                {tag.usageCount}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="bg-card p-4 rounded-xl border border-border">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tag por nome, slug ou contexto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table view */}
      {filteredTags.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <Hash className="h-10 w-10 mx-auto text-muted-foreground opacity-50 mb-3" />
          <p className="text-base font-medium text-foreground">Nenhuma tag encontrada</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tente pesquisar outro termo ou cadastre uma nova tag.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[200px]">Nome & Etiqueta</TableHead>
                <TableHead>Slug (URL)</TableHead>
                <TableHead className="max-w-xs hidden md:table-cell">Descrição</TableHead>
                <TableHead className="text-center">Uso em Notícias</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTags.map((tag) => (
                <TableRow key={tag.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2.5 py-1 rounded-md text-xs font-semibold border flex items-center gap-1"
                        style={{
                          backgroundColor: `${tag.color}15`,
                          color: tag.color,
                          borderColor: `${tag.color}40`,
                        }}
                      >
                        <Hash className="h-3 w-3" />
                        {tag.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    #{tag.slug}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-muted-foreground hidden md:table-cell">
                    {tag.description || "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {tag.usageCount} matérias
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(tag)}
                        aria-label="Editar Tag"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setToDelete(tag)}
                        aria-label="Excluir Tag"
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

      {/* Tag Edit/Create Dialog */}
      <TagDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tag &quot;{toDelete?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá a tag da lista. As notícias que possuem esta tag continuarão salvas sem o vinculo desta etiqueta.
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
