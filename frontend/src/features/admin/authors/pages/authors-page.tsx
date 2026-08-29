"use client"

import { useMemo, useState } from "react"
import { Mail, Pencil, Search, Users } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/admin-shell"
import { AuthorDialog, type AuthorFormValues } from "@/features/admin/authors/components/author-dialog"
import { useAuthors } from "@/features/admin/authors/hooks/use-authors"
import { useUpdateAuthor } from "@/features/admin/authors/hooks/use-update-author"
import type { Author } from "@/features/admin/authors/types/author"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

export default function AuthorsPage() {
  const { data, isLoading, isError } = useAuthors()
  const updateAuthor = useUpdateAuthor()

  const [search, setSearch] = useState("")
  const [columnistFilter, setColumnistFilter] = useState<"all" | "columnist" | "regular">("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Author | null>(null)

  const authors = data?.data ?? []

  const filteredAuthors = useMemo(() => {
    return authors.filter((author) => {
      const matchesSearch =
        author.name.toLowerCase().includes(search.toLowerCase()) ||
        author.slug.toLowerCase().includes(search.toLowerCase()) ||
        author.bio?.toLowerCase().includes(search.toLowerCase())

      if (!matchesSearch) return false

      if (columnistFilter === "columnist") return author.isColumnist
      if (columnistFilter === "regular") return !author.isColumnist
      return true
    })
  }, [authors, search, columnistFilter])

  function openEdit(author: Author) {
    setEditing(author)
    setFormOpen(true)
  }

  function handleSubmit(values: AuthorFormValues) {
    if (!editing) return

    updateAuthor.mutate(
      { id: editing.id, payload: values },
      {
        onSuccess: () => {
          toast.success(`Autor "${editing.name}" atualizado com sucesso.`)
          setFormOpen(false)
          setEditing(null)
        },
        onError: () => {
          toast.error("Erro ao atualizar o autor. Tente novamente.")
        },
      }
    )
  }

  return (
    <div className="p-6 lg:p-10 space-y-6">
      <PageHeader
        title="Autores & Colunistas"
        description="Gerencie a equipe editorial, colunistas e colaboradores do portal."
      />

      {/* Filters and search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-xl border border-border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, slug ou biografia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg">
          <button
            onClick={() => setColumnistFilter("all")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              columnistFilter === "all"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos ({authors.length})
          </button>
          <button
            onClick={() => setColumnistFilter("columnist")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              columnistFilter === "columnist"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Colunistas ({authors.filter((a) => a.isColumnist).length})
          </button>
          <button
            onClick={() => setColumnistFilter("regular")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              columnistFilter === "regular"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Outros ({authors.filter((a) => !a.isColumnist).length})
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border-border bg-card shadow-xs">
              <CardHeader className="p-5 pb-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-3">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 py-16 text-center">
          <p className="text-base font-medium text-destructive">Erro ao carregar autores</p>
          <p className="text-sm text-muted-foreground mt-1">
            Verifique sua conexão ou tente recarregar a página.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && filteredAuthors.length === 0 && (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <Users className="h-10 w-10 mx-auto text-muted-foreground opacity-50 mb-3" />
          <p className="text-base font-medium text-foreground">Nenhum autor encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tente buscar por outro termo.
          </p>
        </div>
      )}

      {/* Grid of Authors */}
      {!isLoading && !isError && filteredAuthors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAuthors.map((author) => {
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
                        <AvatarImage src={author.photo?.path ?? undefined} alt={author.name} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-serif font-bold text-base text-foreground leading-tight">
                          {author.name}
                        </h3>
                        <p className="text-xs font-mono text-muted-foreground mt-0.5">/{author.slug}</p>
                      </div>
                    </div>
                    {author.isColumnist && (
                      <Badge variant="default" className="text-[10px]">
                        Colunista
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-3 flex-1">
                  {author.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed bg-muted/30 p-2.5 rounded-lg border border-border/50">
                      &quot;{author.bio}&quot;
                    </p>
                  )}
                </CardContent>

                <CardFooter className="flex items-center justify-end border-t border-border p-3 px-5 bg-muted/20">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openEdit(author)}
                    aria-label="Editar autor"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* Author Edit Dialog */}
      <AuthorDialog
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v)
          if (!v) setEditing(null)
        }}
        initial={editing}
        onSubmit={handleSubmit}
        isPending={updateAuthor.isPending}
      />
    </div>
  )
}
