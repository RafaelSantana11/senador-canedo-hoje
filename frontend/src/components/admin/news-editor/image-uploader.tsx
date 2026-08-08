"use client"

import { useRef, useState } from "react"
import { Upload, Link as LinkIcon, Image as ImageIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { assetPath } from "@/lib/utils"

interface ImageUploaderProps {
  value: string
  onChange: (url: string) => void
  label?: string
}

export function ImageUploader({ value, onChange, label = "Imagem de capa" }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<"file" | "url">("file")

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
        <Tabs value={tab} onValueChange={(v) => setTab(v as "file" | "url")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file" className="gap-1 text-xs">
              <Upload className="h-3.5 w-3.5" /> Enviar do dispositivo
            </TabsTrigger>
            <TabsTrigger value="url" className="gap-1 text-xs">
              <LinkIcon className="h-3.5 w-3.5" /> URL externa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="mt-2">
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
                <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, WEBP, GIF até 10MB</p>
              </div>
            </label>
          </TabsContent>

          <TabsContent value="url" className="mt-2">
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://exemplo.com/imagem.jpg"
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
