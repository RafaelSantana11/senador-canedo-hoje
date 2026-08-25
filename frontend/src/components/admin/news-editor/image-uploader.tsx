"use client"

import { useRef } from "react"
import { Image as ImageIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { assetPath } from "@/lib/utils"

interface ImageUploaderProps {
  value: string
  onChange: (url: string) => void
  label?: string
}

export function ImageUploader({ value, onChange, label = "Imagem de capa" }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione um arquivo de imagem válido.")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      if (result) {
        onChange(result)
      }
    }
    reader.readAsDataURL(file)
  }

  function handleClear() {
    onChange("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {value ? (
        <div className="relative overflow-hidden rounded-md border border-border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetPath(value)}
            alt="Preview"
            className="h-40 w-full object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-md"
            onClick={handleClear}
            title="Remover imagem"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="grid gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            id="image-file-upload"
          />
          <label
            htmlFor="image-file-upload"
            className="flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-muted/30 p-6 text-center transition-colors hover:bg-accent hover:border-muted-foreground/50 cursor-pointer"
          >
            <div className="rounded-full bg-background p-2 shadow-sm border border-border">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Clique para escolher do computador ou celular</p>
              <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG ou WEBP até 10MB</p>
            </div>
          </label>
          <p className="text-xs text-muted-foreground">
            Formato ideal: <strong>16:9</strong> (ex.: 1200×675px). Imagens nessa proporção ficam melhores no card e na página da matéria.
          </p>
        </div>
      )}
    </div>
  )
}
