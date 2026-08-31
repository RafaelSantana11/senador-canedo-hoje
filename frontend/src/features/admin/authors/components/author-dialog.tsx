"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import type { Author } from "../types/author"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export type AuthorFormValues = {
  name: string
  bio: string
  isColumnist: boolean
  slug: string
}

const emptyValues: AuthorFormValues = {
  name: "",
  bio: "",
  isColumnist: false,
  slug: "",
}

export function AuthorDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  isPending,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: Author | null
  onSubmit: (values: AuthorFormValues) => void
  isPending?: boolean
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AuthorFormValues>({ defaultValues: emptyValues })

  useEffect(() => {
    if (open) {
      reset(
        initial
          ? {
              name: initial.name,
              bio: initial.bio ?? "",
              isColumnist: initial.isColumnist,
              slug: initial.slug,
            }
          : emptyValues,
      )
    }
  }, [open, initial, reset])

  function handleFormSubmit(values: AuthorFormValues) {
    onSubmit({
      name: values.name.trim(),
      bio: values.bio.trim(),
      isColumnist: values.isColumnist,
      slug: values.slug.trim(),
    })
  }

  const initials = (initial?.name ?? "AU")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Autor</DialogTitle>
          <DialogDescription>
            Edite as informações editoriais do autor: nome, bio, slug e status de colunista.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="space-y-4 py-2">
          {/* Author preview */}
          <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-xl border border-border">
            <Avatar className="h-14 w-14 border border-border">
              <AvatarImage src={initial?.photo?.path} alt={initial?.name ?? "Autor"} />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{initial?.name ?? "—"}</p>
              <p className="text-xs text-muted-foreground font-mono">{initial?.slug}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="author-name">Nome</Label>
            <Input
              id="author-name"
              placeholder="ex: Mariana Costa"
              aria-invalid={Boolean(errors.name)}
              {...register("name", {
                required: "Informe o nome do autor.",
              })}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="author-slug">Slug (URL pública)</Label>
            <Input
              id="author-slug"
              placeholder="ex: mariana-costa"
              aria-invalid={Boolean(errors.slug)}
              {...register("slug", {
                required: "Informe o slug.",
                pattern: {
                  value: /^[a-z0-9]+(-[a-z0-9]+)*$/,
                  message: "Apenas letras minúsculas, números e hífens",
                },
              })}
            />
            {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
            <p className="text-[11px] text-muted-foreground">
              ⚠️ Mudar o slug quebra links já publicados do perfil.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="author-bio">Biografia / Apresentação</Label>
            <Textarea
              id="author-bio"
              rows={4}
              placeholder="Breve resumo da trajetória profissional do autor..."
              {...register("bio")}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
