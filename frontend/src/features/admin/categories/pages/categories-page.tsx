"use client"

import { useMemo, useState } from "react"
import { FolderTree, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/admin-shell"
import { useCategories } from "@/features/admin/categories/hooks/use-categories"
import { useCreateCategory } from "@/features/admin/categories/hooks/use-create-category"
import { useUpdateCategory } from "@/features/admin/categories/hooks/use-update-category"
import { useDeleteCategory } from "@/features/admin/categories/hooks/use-delete-category"
import type { Daum } from "@/features/admin/categories/types/category"
import { CategoryDialog, type CategoryFormValues } from "@/features/admin/categories/components/category-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function CategoriesPage() {
  const { data, isLoading } = useCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const categories = useMemo(() => data?.data ?? [], [data])

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Daum | null>(null)
  const [toDelete, setToDelete] = useState<Daum | null>(null)

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const matchesSearch =
        cat.name.toLowerCase().includes(search.toLowerCase()) ||
        cat.slug.toLowerCase().includes(search.toLowerCase()) ||
        cat.description?.toLowerCase().includes(search.toLowerCase())

      if (!matchesSearch) return false

      if (statusFilter === "active") return cat.active
      if (statusFilter === "inactive") return !cat.active
      return true
    })
  }, [categories, search, statusFilter])

  if (isLoading) return null

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(cat: Daum) {
    setEditing(cat)
    setFormOpen(true)
  }

  function handleSubmit(values: CategoryFormValues) {
    if (editing) {
      updateCategory.mutate(
        { id: editing.id, payload: values },
        {
          onSuccess: () => {
            toast.success(`Categoria "${values.name}" atualizada com sucesso.`)
            setFormOpen(false)
          },
          onError: () => {
            toast.error("Não foi possível atualizar a categoria.")
          },
        },
      )
    } else {
      createCategory.mutate(values, {
        onSuccess: () => {
          toast.success(`Categoria "${values.name}" criada com sucesso.`)
          setFormOpen(false)
        },
        onError: () => {
          toast.error("Não foi possível criar a categoria.")
        },
      })
    }
  }

  function confirmDelete() {
    if (toDelete) {
      deleteCategory.mutate(toDelete.id, {
        onSuccess: () => {
          toast.success(`Categoria "${toDelete.name}" removida.`)
          setToDelete(null)
        },
        onError: () => {
          toast.error("Não foi possível excluir a categoria.")
        },
      })
    }
  }

  return (
    <div className="p-6 lg:p-10 space-y-6">
      <PageHeader
        title="Gerenciamento de Categorias"
        description="Organize e estruture as seções temáticas de notícias do portal."
        action={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova categoria
          </Button>
        }
      />

      {/* Filters and search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-xl border border-border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, slug ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              statusFilter === "all"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Todas ({categories.length})
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              statusFilter === "active"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Ativas ({categories.filter((c) => c.active).length})
          </button>
          <button
            onClick={() => setStatusFilter("inactive")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              statusFilter === "inactive"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Inativas ({categories.filter((c) => !c.active).length})
          </button>
        </div>
      </div>

      {/* Table view */}
      {filteredCategories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <FolderTree className="h-10 w-10 mx-auto text-muted-foreground opacity-50 mb-3" />
          <p className="text-base font-medium text-foreground">Nenhuma categoria encontrada</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tente ajustar seus termos de busca ou filtros.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[220px]">Nome & Cor</TableHead>
                <TableHead>Slug (URL)</TableHead>
                <TableHead className="max-w-xs hidden md:table-cell">Descrição</TableHead>
                <TableHead className="text-center">Notícias</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((cat) => {
                const articleCount = cat.newsCount
                return (
                  <TableRow key={cat.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-4 w-4 rounded-full flex-shrink-0 shadow-xs ring-1 ring-black/10"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-semibold text-foreground">{cat.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      /{cat.slug}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-muted-foreground hidden md:table-cell">
                      {cat.description || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-mono text-xs">
                        {articleCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={cat.active}
                          onCheckedChange={() => {
                            updateCategory.mutate(
                              { id: cat.id, payload: { active: !cat.active } },
                              {
                                onSuccess: () => {
                                  toast.info(`Status da categoria "${cat.name}" alterado.`)
                                },
                                onError: () => {
                                  toast.error("Não foi possível alterar o status da categoria.")
                                },
                              },
                            )
                          }}
                        />
                        <span className="text-xs font-medium">
                          {cat.active ? (
                            <span className="text-emerald-600 dark:text-emerald-400">Ativa</span>
                          ) : (
                            <span className="text-muted-foreground">Inativa</span>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(cat)}
                          aria-label="Editar Categoria"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setToDelete(cat)}
                          aria-label="Excluir Categoria"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Category Edit/Create Dialog */}
      <CategoryDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria &quot;{toDelete?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá a categoria do cadastro. As notícias vinculadas permanecerão salvas, porém sem a categoria ativa.
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
