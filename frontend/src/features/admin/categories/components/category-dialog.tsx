"use client"

import { useEffect, useState } from "react"
import type { Category } from "@/components/admin/admin-store"
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

export function CategoryDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: Category | null
  onSubmit: (values: CategoryFormValues) => void
}) {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState("#3b82f6")
  const [active, setActive] = useState(true)

  useEffect(() => {
    if (initial) {
      setName(initial.name)
      setSlug(initial.slug)
      setDescription(initial.description || "")
      setColor(initial.color || "#3b82f6")
      setActive(initial.active)
    } else {
      setName("")
      setSlug("")
      setDescription("")
      setColor("#3b82f6")
      setActive(true)
    }
  }, [initial, open])

  function handleNameChange(val: string) {
    setName(val)
    if (!initial) {
      setSlug(
        val
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
      )
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    onSubmit({
      name: name.trim(),
      slug: slug.trim() || name.toLowerCase().replace(/\s+/g, "-"),
      description: description.trim(),
      color,
      active,
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

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Nome da Categoria</Label>
            <Input
              id="cat-name"
              placeholder="Ex: Política, Economia, Esportes"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-slug">Slug (URL amigável)</Label>
            <Input
              id="cat-slug"
              placeholder="ex: politica-e-governo"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-desc">Descrição</Label>
            <Textarea
              id="cat-desc"
              rows={3}
              placeholder="Breve descrição do tipo de matérias nesta categoria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Cor da Categoria</Label>
            <div className="flex items-center gap-2 pt-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full transition-transform ${
                    color === c ? "ring-2 ring-foreground ring-offset-2 scale-110" : "opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Cor ${c}`}
                />
              ))}
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
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
            <Switch
              id="cat-active"
              checked={active}
              onCheckedChange={setActive}
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
