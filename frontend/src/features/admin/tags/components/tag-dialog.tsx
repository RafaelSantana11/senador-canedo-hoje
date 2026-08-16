"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import type { Daum } from "@/features/admin/tags/types/tag"
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

export type TagFormValues = {
  name: string
  slug: string
  color: string
  description: string
}

const PRESET_COLORS = [
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#64748b", // Slate
]

const emptyValues: TagFormValues = {
  name: "",
  slug: "",
  color: "#8b5cf6",
  description: "",
}

function slugify(val: string) {
  return val
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
}

export function TagDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: Daum | null
  onSubmit: (values: TagFormValues) => void
}) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TagFormValues>({ defaultValues: emptyValues })

  const color = watch("color")

  useEffect(() => {
    if (open) {
      reset(
        initial
          ? {
              name: initial.name,
              slug: initial.slug,
              description: initial.description || "",
              color: initial.color || "#8b5cf6",
            }
          : emptyValues,
      )
    }
  }, [open, initial, reset])

  function handleFormSubmit(values: TagFormValues) {
    onSubmit({
      name: values.name.trim(),
      slug: values.slug.trim() || slugify(values.name),
      color: values.color,
      description: values.description.trim(),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar Tag" : "Nova Tag"}</DialogTitle>
          <DialogDescription>
            Etiquetas auxiliam no agrupamento de assuntos específicos e buscas no portal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="tag-name">Nome da Tag</Label>
            <Input
              id="tag-name"
              placeholder="Ex: Eleições 2026, Taxa Selic, Reforma Tributária"
              aria-invalid={Boolean(errors.name)}
              {...register("name", {
                required: "Informe o nome da tag.",
                onChange: (e) => {
                  if (!initial) {
                    setValue("slug", slugify(e.target.value))
                  }
                },
              })}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag-slug">Slug (URL)</Label>
            <Input
              id="tag-slug"
              placeholder="ex: eleicoes-2026"
              aria-invalid={Boolean(errors.slug)}
              {...register("slug", {
                required: "Informe o slug da tag.",
                minLength: { value: 2, message: "O slug deve ter ao menos 2 caracteres." },
              })}
            />
            {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag-desc">Descrição / Contexto</Label>
            <Textarea
              id="tag-desc"
              rows={3}
              placeholder="Descreva brevemente sobre o que se trata esta tag..."
              {...register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label>Cor da Tag</Label>
            <div className="flex items-center gap-2 pt-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue("color", c)}
                  className={`h-7 w-7 rounded-full transition-transform ${
                    color === c ? "ring-2 ring-foreground ring-offset-2 scale-110" : "opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Cor ${c}`}
                />
              ))}
              <Input
                type="color"
                aria-label="Cor personalizada"
                {...register("color")}
                className="h-8 w-10 cursor-pointer p-0.5"
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{initial ? "Salvar Alterações" : "Criar Tag"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
