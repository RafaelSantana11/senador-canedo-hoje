"use client"

import { useEffect } from "react"
import Image from "next/image"
import { useForm, Controller } from "react-hook-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AdminArticle } from "@/components/admin/admin-store"

export type ArticleFormValues = Omit<AdminArticle, "id" | "createdAt">

const IMAGE_OPTIONS = [
  { label: "Congresso", value: "/news/hero-congress.png" },
  { label: "Economia", value: "/news/economy.png" },
  { label: "Tecnologia", value: "/news/technology.png" },
  { label: "Esportes", value: "/news/sports.png" },
  { label: "Saúde", value: "/news/health.png" },
  { label: "Meio Ambiente", value: "/news/environment.png" },
  { label: "Mundo", value: "/news/world.png" },
  { label: "Cultura", value: "/news/culture.png" },
  { label: "Política", value: "/news/politics-small.png" },
]

const empty: ArticleFormValues = {
  title: "",
  excerpt: "",
  content: "",
  category: "",
  image: IMAGE_OPTIONS[0].value,
  author: "Redação",
  status: "Publicado",
  urgent: false,
}

export function ArticleFormDialog({
  open,
  onOpenChange,
  categories,
  initial,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  categories: string[]
  initial?: AdminArticle | null
  onSubmit: (values: ArticleFormValues) => void
}) {
  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
  } = useForm<ArticleFormValues>({ defaultValues: empty })

  useEffect(() => {
    if (open) {
      reset(
        initial
          ? {
              title: initial.title,
              excerpt: initial.excerpt,
              content: initial.content || "",
              category: initial.category,
              image: initial.image,
              author: initial.author,
              status: initial.status,
              urgent: initial.urgent,
            }
          : { ...empty, category: categories[0] ?? "" },
      )
    }
  }, [open, initial, categories, reset])

  const values = watch()

  function handleFormSubmit(data: ArticleFormValues) {
    onSubmit(data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {initial ? "Editar notícia" : "Nova notícia"}
          </DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para {initial ? "atualizar a" : "publicar uma nova"} matéria.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Digite a manchete"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="excerpt">Resumo</Label>
            <Textarea
              id="excerpt"
              {...register("excerpt")}
              placeholder="Breve descrição da notícia"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Categoria</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="author">Autor</Label>
              <Input
                id="author"
                {...register("author")}
                placeholder="Redação"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Imagem</Label>
              <Controller
                control={control}
                name="image"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {IMAGE_OPTIONS.map((img) => (
                        <SelectItem key={img.value} value={img.value}>
                          {img.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Publicado">Publicado</SelectItem>
                      <SelectItem value="Rascunho">Rascunho</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="relative h-32 w-full overflow-hidden rounded-lg border border-border bg-muted">
            <Image
              src={values.image || "/placeholder.svg"}
              alt="Pré-visualização"
              fill
              className="object-cover"
              sizes="512px"
            />
          </div>

          <Controller
            control={control}
            name="urgent"
            render={({ field }) => (
              <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-[var(--destructive)]"
                />
                Marcar como <span className="font-semibold text-destructive">Urgente</span>
              </label>
            )}
          />

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{initial ? "Salvar alterações" : "Publicar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
