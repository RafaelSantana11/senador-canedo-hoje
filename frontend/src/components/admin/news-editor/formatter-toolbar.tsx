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
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

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

/* ─── Small reusable toolbar button ──────────────────────────────── */

function ToolbarButton({
  onClick,
  label,
  shortcut,
  children,
}: {
  onClick: () => void
  label: string
  shortcut?: string
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className="group/tbtn relative inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-all duration-150 hover:bg-primary/8 hover:text-primary active:scale-95"
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>
        <span className="font-medium">{label}</span>
        {shortcut && (
          <kbd className="ml-1.5 inline-flex items-center rounded border border-background/20 bg-background/10 px-1 py-px font-mono text-[10px] text-background/70">
            {shortcut}
          </kbd>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

/* ─── Separator ──────────────────────────────────────────────────── */

function ToolbarSeparator() {
  return <span className="mx-1 h-5 w-px bg-border/60" aria-hidden />
}

/* ─── Group with optional label ──────────────────────────────────── */

function ToolbarGroup({
  label,
  children,
}: {
  label?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-0">
      {label && <span className="toolbar-group-label">{label}</span>}
      <div className="flex items-center gap-0.5">{children}</div>
    </div>
  )
}

/* ─── Main Toolbar ───────────────────────────────────────────────── */

export function FormatterToolbar(props: FormatterToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    <TooltipProvider delay={300} closeDelay={100}>
      <div
        className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 px-2 py-1.5 backdrop-blur-sm"
        onMouseDown={(e) => e.preventDefault()}
      >
        {/* ─── Headings ──────────────────────────────────── */}
        <ToolbarGroup label="Título">
          <ToolbarButton onClick={props.onH1} label="Título 1" shortcut="H1">
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={props.onH2} label="Título 2" shortcut="H2">
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={props.onH3} label="Título 3" shortcut="H3">
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarSeparator />

        {/* ─── Inline formatting ─────────────────────────── */}
        <ToolbarGroup label="Texto">
          <ToolbarButton onClick={props.onBold} label="Negrito" shortcut="⌘B">
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={props.onItalic}
            label="Itálico"
            shortcut="⌘I"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={props.onCode}
            label="Código inline"
            shortcut="⌘E"
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarSeparator />

        {/* ─── Inserir ───────────────────────────────────── */}
        <ToolbarGroup label="Inserir">
          <ToolbarButton
            onClick={props.onLink}
            label="Inserir link"
            shortcut="⌘K"
          >
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={props.onImage} label="Imagem por URL">
            <ImageIcon className="h-4 w-4" />
          </ToolbarButton>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <ToolbarButton
            onClick={() => fileInputRef.current?.click()}
            label="Upload de imagem"
          >
            <Upload className="h-4 w-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarSeparator />

        {/* ─── Blocos ────────────────────────────────────── */}
        <ToolbarGroup label="Bloco">
          <ToolbarButton onClick={props.onUl} label="Lista não ordenada">
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={props.onOl} label="Lista ordenada">
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={props.onQuote} label="Citação">
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={props.onHr} label="Linha horizontal">
            <Minus className="h-4 w-4" />
          </ToolbarButton>
        </ToolbarGroup>
      </div>
    </TooltipProvider>
  )
}
