"use client"

import { useEffect, useState } from "react"
import type { Media } from "@/components/admin/admin-store"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type MediaFormValues = {
  title: string
  url: string
  type: "image" | "video" | "document"
  alt: string
  size: string
  dimensions?: string
}

export function MediaDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: Media | null
  onSubmit: (values: MediaFormValues) => void
}) {
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [type, setType] = useState<"image" | "video" | "document">("image")
  const [alt, setAlt] = useState("")
  const [size, setSize] = useState("")
  const [dimensions, setDimensions] = useState("")

  useEffect(() => {
    if (initial) {
      setTitle(initial.title)
      setUrl(initial.url)
      setType(initial.type)
      setAlt(initial.alt || "")
      setSize(initial.size || "1.0 MB")
      setDimensions(initial.dimensions || "1920x1080")
    } else {
      setTitle("")
      setUrl("/news/hero-congress.png")
      setType("image")
      setAlt("")
      setSize("1.2 MB")
      setDimensions("1920x1080")
    }
  }, [initial, open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !url.trim()) return

    onSubmit({
      title: title.trim(),
      url: url.trim(),
      type,
      alt: alt.trim() || title.trim(),
      size: size.trim() || "1.0 MB",
      dimensions: dimensions.trim() || undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar Mídia" : "Adicionar Nova Mídia"}</DialogTitle>
          <DialogDescription>
            Insira os dados do arquivo de imagem, vídeo ou documento no acervo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="media-title">Título do Arquivo</Label>
            <Input
              id="media-title"
              placeholder="Ex: Foto Fachada do Congresso"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="media-url">URL / Caminho da Mídia</Label>
            <Input
              id="media-url"
              placeholder="/news/imagem.png ou https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="media-type">Tipo de Mídia</Label>
              <Select value={type} onValueChange={(val) => setType(val as "image" | "video" | "document")}>
                <SelectTrigger id="media-type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Imagem</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="document">Documento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="media-size">Tamanho do Arquivo</Label>
              <Input
                id="media-size"
                placeholder="Ex: 1.4 MB"
                value={size}
                onChange={(e) => setSize(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="media-alt">Texto Alternativo (ALT)</Label>
            <Input
              id="media-alt"
              placeholder="Descrição da imagem para acessibilidade e SEO"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="media-dim">Dimensões (Px)</Label>
            <Input
              id="media-dim"
              placeholder="Ex: 1920x1080"
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{initial ? "Salvar Alterações" : "Salvar Mídia"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
