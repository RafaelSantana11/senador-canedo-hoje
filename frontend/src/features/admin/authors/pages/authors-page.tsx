"use client"

import { useMemo, useState } from "react"
import { Mail, Pencil, Plus, Search, Trash2, UserCheck, UserX, Users } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/admin-shell"
import { useAdminStore, type Author } from "@/components/admin/admin-store"
import { AuthorDialog, type AuthorFormValues } from "@/features/admin/authors/components/author-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

export default function AuthorsPage() {
  const { ready, authors, articles, addAuthor, updateAuthor, deleteAuthor, toggleAuthor } =
    useAdminStore()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Author | null>(null)
  const [toDelete, setToDelete] = useState<Author | null>(null)

  // Map author article counts
  const authorArticleCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    articles.forEach((a) => {
      if (a.author) {
        counts[a.author] = (counts[a.author] || 0) + 1
      }
    })
    return counts
  }, [articles])

  const filteredAuthors = useMemo(() => {
    return authors.filter((author) => {
      const matchesSearch =
        author.name.toLowerCase().includes(search.toLowerCase()) ||
        author.email.toLowerCase().includes(search.toLowerCase()) ||
        author.role.toLowerCase().includes(search.toLowerCase()) ||
        author.bio?.toLowerCase().includes(search.toLowerCase())

      if (!matchesSearch) return false

      if (statusFilter === "active") return author.active
      if (statusFilter === "inactive") return !author.active
      return true
    })
  }, [authors, search, statusFilter])

  if (!ready) return null

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(author: Author) {
    setEditing(author)
    setFormOpen(true)
  }

  function handleSubmit(values: AuthorFormValues) {
    if (editing) {
      updateAuthor(editing.id, values)
      toast.success(`Autor "${values.name}" atualizado.`)
    } else {
      addAuthor(values)
      toast.success(`Autor "${values.name}" cadastrado.`)
    }
  }

  function confirmDelete() {
    if (toDelete) {
      deleteAuthor(toDelete.id)
      toast.success(`Autor "${toDelete.name}" removido.`)
      setToDelete(null)
    }
  }

  return (
    <div className="p-6 lg:p-10 space-y-6">
      <PageHeader
        title="Autores & Colunistas"
        description="Gerencie a equipe editorial, colunistas e colaboradores do portal."
        action={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo autor
          </Button>
        }
      />

      {/* Filters and search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-xl border border-border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail, cargo ou biografia..."
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
            Todos ({authors.length})
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              statusFilter === "active"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Ativos ({authors.filter((a) => a.active).length})
          </button>
          <button
            onClick={() => setStatusFilter("inactive")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              statusFilter === "inactive"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Inativos ({authors.filter((a) => !a.active).length})
          </button>
        </div>
      </div>

      {/* Grid of Authors */}
      {filteredAuthors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <Users className="h-10 w-10 mx-auto text-muted-foreground opacity-50 mb-3" />
          <p className="text-base font-medium text-foreground">Nenhum autor encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tente buscar por outro termo ou cadastre um novo autor.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAuthors.map((author) => {
            const articleCount = authorArticleCounts[author.name] || 0
            const initials = author.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase()

            return (
              <Card
                key={author.id}
                className="overflow-hidden border-border bg-card shadow-xs flex flex-col justify-between"
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border border-border">
                        <AvatarImage src={author.avatar} alt={author.name} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-serif font-bold text-base text-foreground leading-tight">
                          {author.name}
                        </h3>
                        <p className="text-xs font-medium text-secondary mt-0.5">{author.role}</p>
                      </div>
                    </div>
                    <Badge variant={author.active ? "default" : "secondary"} className="text-[10px]">
                      {author.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-3 flex-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{author.email}</span>
                  </div>

                  {author.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed bg-muted/30 p-2.5 rounded-lg border border-border/50">
                      &quot;{author.bio}&quot;
                    </p>
                  )}

                  {/* Social links badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {author.twitter && (
                      <Badge variant="outline" className="text-[10px] gap-1 font-mono">
                        X: {author.twitter}
                      </Badge>
                    )}
                    {author.instagram && (
                      <Badge variant="outline" className="text-[10px] gap-1 font-mono">
                        IG: {author.instagram}
                      </Badge>
                    )}
                    {author.linkedin && (
                      <Badge variant="outline" className="text-[10px] gap-1 font-mono">
                        in: {author.linkedin}
                      </Badge>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="flex items-center justify-between border-t border-border p-3 px-5 bg-muted/20">
                  <div className="text-xs text-muted-foreground font-medium">
                    <span className="font-bold text-foreground">{articleCount}</span> matérias
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        toggleAuthor(author.id)
                        toast.info(`Status de ${author.name} alterado.`)
                      }}
                      title={author.active ? "Desativar autor" : "Ativar autor"}
                    >
                      {author.active ? (
                        <UserX className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <UserCheck className="h-4 w-4 text-emerald-600" />
                      )}
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEdit(author)}
                      aria-label="Editar autor"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setToDelete(author)}
                      aria-label="Excluir autor"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* Author Edit/Create Dialog */}
      <AuthorDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir autor &quot;{toDelete?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá o autor do cadastro. As matérias previamente escritas por ele continuarão mantidas no portal.
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
