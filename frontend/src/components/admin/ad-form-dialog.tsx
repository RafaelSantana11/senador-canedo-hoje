"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Ad, AdPlacement } from "@/components/admin/admin-store"

export type AdFormValues = Omit<Ad, "id" | "createdAt">

const PLACEMENTS: AdPlacement[] = [
  "Topo (Leaderboard)",
  "Lateral (Box)",
  "Rodapé",
]

const IMAGE_OPTIONS = [
  { label: "Economia", value: "/news/economy.png" },
  { label: "Tecnologia", value: "/news/technology.png" },
  { label: "Carro elétrico", value: "/news/video-2.png" },
  { label: "Gastronomia", value: "/news/video-3.png" },
  { label: "Estúdio", value: "/news/video-1.png" },
  { label: "Cultura", value: "/news/culture.png" },
]

const empty: AdFormValues = {
  title: "",
  advertiser: "",
  image: IMAGE_OPTIONS[0].value,
  link: "https://",
  placement: "Topo (Leaderboard)",
  active: true,
}

export function AdFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: Ad | null
  onSubmit: (values: AdFormValues) => void
}) {
  const [values, setValues] = useState<AdFormValues>(empty)

  useEffect(() => {
    if (open) {
      setValues(
        initial
          ? {
              title: initial.title,
              advertiser: initial.advertiser,
              image: initial.image,
              link: initial.link,
              placement: initial.placement,
              active: initial.active,
            }
          : empty,
      )
    }
  }, [open, initial])

  function set<K extends keyof AdFormValues>(key: K, value: AdFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!values.title.trim() || !values.advertiser.trim()) return
    onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {initial ? "Editar publicidade" : "Nova publicidade"}
          </DialogTitle>
          <DialogDescription>
            Configure a campanha e escolha onde ela será exibida no portal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ad-title">Título da campanha</Label>
              <Input
                id="ad-title"
                value={values.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Ex: Campanha de verão"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="advertiser">Anunciante</Label>
              <Input
                id="advertiser"
                value={values.advertiser}
                onChange={(e) => set("advertiser", e.target.value)}
                placeholder="Nome da marca"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="link">Link de destino</Label>
            <Input
              id="link"
              type="url"
              value={values.link}
              onChange={(e) => set("link", e.target.value)}
              placeholder="https://exemplo.com"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Posição</Label>
              <Select
                value={values.placement}
                onValueChange={(v) => v && set("placement", v as AdPlacement)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLACEMENTS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Imagem (criativo)</Label>
              <Select value={values.image} onValueChange={(v) => v && set("image", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_OPTIONS.map((img) => (
                    <SelectItem key={img.value} value={img.value}>
                      {img.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="relative h-32 w-full overflow-hidden rounded-lg border border-border bg-muted">
            <Image
              src={values.image || "/placeholder.svg"}
              alt="Pré-visualização do anúncio"
              fill
              className="object-cover"
              sizes="512px"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={values.active}
              onChange={(e) => set("active", e.target.checked)}
              className="h-4 w-4 rounded border-border accent-[var(--secondary)]"
            />
            Campanha ativa
          </label>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{initial ? "Salvar alterações" : "Criar campanha"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
