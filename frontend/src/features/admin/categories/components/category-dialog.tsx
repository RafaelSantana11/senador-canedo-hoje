"use client"

import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import type { Daum } from "@/features/admin/categories/types/category"
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
import { Switch } from "@/components/ui/switch"

export type CategoryFormValues = {
  name: string
  slug: string
  description: string
  color: string
  active: boolean
}

const PRESET_COLORS = [
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#84cc16", // Lime
  "#64748b", // Slate
]

const emptyValues: CategoryFormValues = {
  name: "",
  slug: "",
  description: "",
  color: "#3b82f6",
  active: true,
}

function slugify(val: string) {
  return val
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
}

export function CategoryDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: Daum | null
  onSubmit: (values: CategoryFormValues) => void
}) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryFormValues>({ defaultValues: emptyValues })

  const color = watch("color")

  useEffect(() => {
    if (open) {
      reset(
        initial
          ? {
              name: initial.name,
              slug: initial.slug,
              description: initial.description || "",
              color: initial.color || "#3b82f6",
              active: initial.active,
            }
          : emptyValues,
      )
    }
  }, [open, initial, reset])

  function handleFormSubmit(values: CategoryFormValues) {
    onSubmit({
      name: values.name.trim(),
      slug: values.slug.trim() || slugify(values.name),
      description: values.description.trim(),
      color: values.color,
      active: values.active,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da categoria de conteúdo do portal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Nome da Categoria</Label>
            <Input
              id="cat-name"
              placeholder="Ex: Política, Economia, Esportes"
              aria-invalid={Boolean(errors.name)}
              {...register("name", {
                required: "Informe o nome da categoria.",
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
            <Label htmlFor="cat-slug">Slug (URL amigável)</Label>
            <Input
              id="cat-slug"
              placeholder="ex: politica-e-governo"
              aria-invalid={Boolean(errors.slug)}
              {...register("slug", {
                required: "Informe o slug da categoria.",
                minLength: { value: 2, message: "O slug deve ter ao menos 2 caracteres." },
              })}
            />
            {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-desc">Descrição</Label>
            <Textarea
              id="cat-desc"
              rows={3}
              placeholder="Breve descrição do tipo de matérias nesta categoria..."
              {...register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label>Cor da Categoria</Label>
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

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="cat-active" className="text-sm font-medium">
                Categoria Ativa
              </Label>
              <p className="text-xs text-muted-foreground">
                Categorias ativas aparecem na navegação principal do portal.
              </p>
            </div>
            <Controller
              control={control}
              name="active"
              render={({ field }) => (
                <Switch id="cat-active" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{initial ? "Salvar Alterações" : "Criar Categoria"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
