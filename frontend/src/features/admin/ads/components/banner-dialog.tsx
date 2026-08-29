"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Controller, useForm } from "react-hook-form"
import { ImagePlus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Banner } from "../types/banner"
import { BANNER_POSITIONS, POSITION_LABELS, type BannerPayload, type BannerPosition } from "../types/banner"
import { uploadFile } from "../services/files-service"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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

const MAX_FILE_BYTES = 5 * 1024 * 1024
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif"]

export type BannerFormValues = {
  title: string
  advertiser: string
  position: BannerPosition
  active: boolean
  linkUrl: string
  durationSec: number
  fileId: string | null
  filePath: string
}

const emptyValues: BannerFormValues = {
  title: "",
  advertiser: "",
  position: "top",
  active: true,
  linkUrl: "",
  durationSec: 5,
  fileId: null,
  filePath: "",
}

export function BannerDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: Banner | null
  onSubmit: (payload: BannerPayload) => void
}) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BannerFormValues>({ defaultValues: emptyValues })

  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filePath = watch("filePath")

  useEffect(() => {
    if (!open) return

    if (initial) {
      const item = initial.items[0]
      reset({
        title: initial.title,
        advertiser: initial.advertiser ?? "",
        position: initial.position,
        active: initial.active,
        linkUrl: item?.linkUrl ?? "",
        durationSec: Math.round((item?.durationMs ?? 5000) / 100) / 10,
        fileId: item?.file.id ?? null,
        filePath: item?.file.path ?? "",
      })
    } else {
      reset(emptyValues)
    }
  }, [open, initial, reset])

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Formato inválido. Use jpg, png ou gif.")
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error("Arquivo acima de 5 MB.")
      return
    }

    try {
      setUploading(true)
      const uploaded = await uploadFile(file)
      setValue("fileId", uploaded.id)
      setValue("filePath", uploaded.path ?? "")
    } catch {
      toast.error("Não foi possível enviar a imagem.")
    } finally {
      setUploading(false)
    }
  }

  function handleFormSubmit(values: BannerFormValues) {
    onSubmit({
      title: values.title.trim(),
      advertiser: values.advertiser.trim() || null,
      position: values.position,
      active: values.active,
      items: values.fileId
        ? [
            {
              file: { id: values.fileId },
              durationMs: Math.round(values.durationSec * 1000),
              linkUrl: values.linkUrl.trim() || null,
              order: 0,
            },
          ]
        : [],
    })
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
              <Label htmlFor="banner-title">Título da campanha</Label>
              <Input
                id="banner-title"
                placeholder="Ex: Campanha Black Friday"
                aria-invalid={Boolean(errors.title)}
                {...register("title", { required: "Informe o título da campanha." })}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="banner-advertiser">Anunciante</Label>
              <Input
                id="banner-advertiser"
                placeholder="Nome da marca"
                {...register("advertiser")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Posição</Label>
              <Controller
                control={control}
                name="position"
                render={({ field }) => (
                  <Select value={field.value} items={POSITION_LABELS} onValueChange={(v) => v && field.onChange(v as BannerPosition)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BANNER_POSITIONS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {POSITION_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="banner-duration">Duração em tela (segundos)</Label>
              <Input
                id="banner-duration"
                type="number"
                step="0.5"
                min={0.5}
                max={300}
                {...register("durationSec", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="banner-link">Link de destino</Label>
            <Input
              id="banner-link"
              type="url"
              placeholder="https://exemplo.com"
              {...register("linkUrl")}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Criativo</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              className="hidden"
              onChange={handleFileChange}
            />
            {filePath ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative h-40 w-full overflow-hidden rounded-lg border border-border bg-muted"
                aria-label="Trocar imagem"
              >
                <Image
                  src={filePath}
                  alt="Pré-visualização do criativo"
                  fill
                  className="object-cover"
                  sizes="512px"
                  unoptimized
                />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/50 text-sm text-muted-foreground transition-colors hover:bg-muted"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Enviando imagem...
                  </>
                ) : (
                  <>
                    <ImagePlus className="h-6 w-6" />
                    Selecionar imagem do anúncio (jpg, png ou gif, até 5 MB)
                  </>
                )}
              </button>
            )}
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
            <Button type="submit" disabled={uploading}>
              {initial ? "Salvar alterações" : "Criar campanha"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
