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
import { Checkbox } from "@/components/ui/checkbox"
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
  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
  } = useForm<AdFormValues>({ defaultValues: empty })

  useEffect(() => {
    if (open) {
      reset(
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
  }, [open, initial, reset])

  const values = watch()

  function handleFormSubmit(data: AdFormValues) {
    onSubmit(data)
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

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ad-title">Título da campanha</Label>
              <Input
                id="ad-title"
                {...register("title")}
                placeholder="Ex: Campanha de verão"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="advertiser">Anunciante</Label>
              <Input
                id="advertiser"
                {...register("advertiser")}
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
              {...register("link")}
              placeholder="https://exemplo.com"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Posição</Label>
              <Controller
                control={control}
                name="placement"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => v && field.onChange(v)}>
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
                )}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Imagem (criativo)</Label>
              <Controller
                control={control}
                name="image"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => v && field.onChange(v)}>
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
                )}
              />
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

          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked)}
                  className="data-checked:border-secondary data-checked:bg-secondary"
                />
                Campanha ativa
              </label>
            )}
          />

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
