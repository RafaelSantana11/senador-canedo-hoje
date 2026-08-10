"use client"

import { useEffect, useState } from "react"
import type { Tag } from "@/components/admin/admin-store"
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
  usageCount: number
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

export function TagDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: Tag | null
  onSubmit: (values: TagFormValues) => void
}) {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [color, setColor] = useState("#8b5cf6")
  const [description, setDescription] = useState("")

  useEffect(() => {
    if (initial) {
      setName(initial.name)
      setSlug(initial.slug)
      setColor(initial.color || "#8b5cf6")
      setDescription(initial.description || "")
    } else {
      setName("")
      setSlug("")
      setColor("#8b5cf6")
      setDescription("")
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
      color,
      description: description.trim(),
      usageCount: initial ? initial.usageCount : 0,
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

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="tag-name">Nome da Tag</Label>
            <Input
              id="tag-name"
              placeholder="Ex: Eleições 2026, Taxa Selic, Reforma Tributária"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag-slug">Slug (URL)</Label>
            <Input
              id="tag-slug"
              placeholder="ex: eleicoes-2026"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag-desc">Descrição / Contexto</Label>
            <Textarea
              id="tag-desc"
              rows={3}
              placeholder="Descreva brevemente sobre o que se trata esta tag..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Cor da Tag</Label>
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
