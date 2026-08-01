"use client"

import { useRef } from "react"
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Image as ImageIcon,
  Code,
  Minus,
  Upload,
} from "lucide-react"

interface FormatterToolbarProps {
  onBold: () => void
  onItalic: () => void
  onH1: () => void
  onH2: () => void
  onH3: () => void
  onQuote: () => void
  onUl: () => void
  onOl: () => void
  onLink: () => void
  onImage: () => void
  onUploadImage: (dataUrl: string) => void
  onCode: () => void
  onHr: () => void
}

export function FormatterToolbar(props: FormatterToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const btn =
    "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
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
        props.onUploadImage(result)
      }
    }
    reader.readAsDataURL(file)
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 p-1"
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        type="button"
        className={btn}
        onClick={props.onH1}
        aria-label="Título 1"
        title="Título 1 (H1)"
      >
        <Heading1 className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn}
        onClick={props.onH2}
        aria-label="Título 2"
        title="Título 2 (H2)"
      >
        <Heading2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn}
        onClick={props.onH3}
        aria-label="Título 3"
        title="Título 3 (H3)"
      >
        <Heading3 className="h-4 w-4" />
      </button>

      <span className="mx-1 h-5 w-px bg-border" />

      <button
        type="button"
        className={btn}
        onClick={props.onBold}
        aria-label="Negrito"
        title="Negrito"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn}
        onClick={props.onItalic}
        aria-label="Itálico"
        title="Itálico"
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn}
        onClick={props.onCode}
        aria-label="Código"
        title="Código inline"
      >
        <Code className="h-4 w-4" />
      </button>

      <span className="mx-1 h-5 w-px bg-border" />

      <button
        type="button"
        className={btn}
        onClick={props.onLink}
        aria-label="Link"
        title="Inserir link"
      >
        <LinkIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn}
        onClick={props.onImage}
        aria-label="Imagem URL"
        title="Inserir imagem por URL"
      >
        <ImageIcon className="h-4 w-4" />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      <button
        type="button"
        className={btn}
        onClick={() => fileInputRef.current?.click()}
        aria-label="Upload de imagem"
        title="Upload de imagem do computador/celular"
      >
        <Upload className="h-4 w-4" />
      </button>

      <span className="mx-1 h-5 w-px bg-border" />

      <button
        type="button"
        className={btn}
        onClick={props.onUl}
        aria-label="Lista"
        title="Lista não ordenada"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn}
        onClick={props.onOl}
        aria-label="Lista numerada"
        title="Lista ordenada"
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn}
        onClick={props.onQuote}
        aria-label="Citação"
        title="Citação (blockquote)"
      >
        <Quote className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn}
        onClick={props.onHr}
        aria-label="Linha horizontal"
        title="Linha horizontal"
      >
        <Minus className="h-4 w-4" />
      </button>
    </div>
  )
}
