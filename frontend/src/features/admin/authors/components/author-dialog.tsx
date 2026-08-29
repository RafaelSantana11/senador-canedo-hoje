"use client"

import { useEffect, useState } from "react"
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
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export type AuthorFormValues = {
  bio: string
  isColumnist: boolean
  slug: string
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
  const [bio, setBio] = useState("")
  const [isColumnist, setIsColumnist] = useState(false)
  const [slug, setSlug] = useState("")

  useEffect(() => {
    if (initial) {
      setBio(initial.bio ?? "")
      setIsColumnist(initial.isColumnist)
      setSlug(initial.slug)
    } else {
      setBio("")
      setIsColumnist(false)
      setSlug("")
    }
  }, [initial, open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      bio: bio.trim(),
      isColumnist,
      slug: slug.trim(),
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
            Edite as informações editoriais do autor: bio, slug e status de colunista.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
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
            <Label htmlFor="author-slug">Slug (URL pública)</Label>
            <Input
              id="author-slug"
              placeholder="ex: mariana-costa"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
              title="Apenas letras minúsculas, números e hífens"
            />
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
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="author-columnist" className="text-sm font-medium">
                Colunista
              </Label>
              <p className="text-xs text-muted-foreground">
                Colunistas são exibidos na seção de destaque do portal.
              </p>
            </div>
            <Switch
              id="author-columnist"
              checked={isColumnist}
              onCheckedChange={setIsColumnist}
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
