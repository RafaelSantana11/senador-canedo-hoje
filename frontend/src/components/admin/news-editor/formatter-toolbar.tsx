"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
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
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo2,
  Redo2,
  Paintbrush,
  Highlighter,
  RemoveFormatting,
  Indent,
  Outdent,
  ChevronDown,
} from "lucide-react"
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/* ─── Types ──────────────────────────────────────────────────────── */

export interface ActiveFormats {
  bold: boolean
  italic: boolean
  underline: boolean
  strikeThrough: boolean
  justifyLeft: boolean
  justifyCenter: boolean
  justifyRight: boolean
  justifyFull: boolean
  insertUnorderedList: boolean
  insertOrderedList: boolean
}

export const EMPTY_FORMATS: ActiveFormats = {
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  justifyLeft: false,
  justifyCenter: false,
  justifyRight: false,
  justifyFull: false,
  insertUnorderedList: false,
  insertOrderedList: false,
}

interface FormatterToolbarProps {
  onBold: () => void
  onItalic: () => void
  onUnderline: () => void
  onStrikethrough: () => void
  onH1: () => void
  onH2: () => void
  onH3: () => void
  onQuote: () => void
  onUl: () => void
  onOl: () => void
  onLink: () => void
  onImage: () => void
  onInstagram: () => void
  onFacebook: () => void
  onUploadImage: (file: File) => void
  onCode: () => void
  onHr: () => void
  onAlignLeft: () => void
  onAlignCenter: () => void
  onAlignRight: () => void
  onAlignJustify: () => void
  onUndo: () => void
  onRedo: () => void
  onTextColor: (color: string) => void
  onHighlight: (color: string) => void
  onClearFormat: () => void
  onIndent: () => void
  onOutdent: () => void
  activeFormats: ActiveFormats
}

/* ─── Color Palettes ─────────────────────────────────────────────── */

const TEXT_COLORS = [
  { label: "Preto", value: "#0f172a" },
  { label: "Cinza", value: "#64748b" },
  { label: "Vermelho", value: "#dc2626" },
  { label: "Laranja", value: "#ea580c" },
  { label: "Âmbar", value: "#d97706" },
  { label: "Verde", value: "#16a34a" },
  { label: "Azul", value: "#2563eb" },
  { label: "Índigo", value: "#4f46e5" },
  { label: "Roxo", value: "#9333ea" },
  { label: "Rosa", value: "#db2777" },
]

const HIGHLIGHT_COLORS = [
  { label: "Amarelo", value: "#fef08a" },
  { label: "Verde claro", value: "#bbf7d0" },
  { label: "Azul claro", value: "#bfdbfe" },
  { label: "Rosa claro", value: "#fbcfe8" },
  { label: "Roxo claro", value: "#e9d5ff" },
  { label: "Laranja claro", value: "#fed7aa" },
  { label: "Cinza claro", value: "#e2e8f0" },
  { label: "Ciano claro", value: "#a5f3fc" },
  { label: "Vermelho claro", value: "#fecaca" },
  { label: "Sem destaque", value: "transparent" },
]

/* ─── Brand icons (lucide removed brand icons) ───────────────────── */

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

/* ─── Small reusable toolbar button ──────────────────────────────── */

function ToolbarButton({
  onClick,
  label,
  shortcut,
  active = false,
  children,
}: {
  onClick: () => void
  label: string
  shortcut?: string
  active?: boolean
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
            aria-pressed={active}
            className={cn(
              "group/tbtn relative inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-all duration-150 hover:bg-primary/8 hover:text-primary active:scale-95",
              active && "toolbar-btn-active"
            )}
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
  return <span className="mx-0.5 h-5 w-px bg-border/60" aria-hidden />
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

/* ─── Color Picker Dropdown ──────────────────────────────────────── */

function ColorPickerDropdown({
  colors,
  onSelect,
  label,
  icon: Icon,
  indicatorColor,
}: {
  colors: { label: string; value: string }[]
  onSelect: (color: string) => void
  label: string
  icon: React.ComponentType<{ className?: string }>
  indicatorColor?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={label}
              className="group/tbtn relative inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-all duration-150 hover:bg-primary/8 hover:text-primary active:scale-95"
            />
          }
        >
          <div className="relative flex items-center">
            <Icon className="h-4 w-4" />
            <ChevronDown className="h-2.5 w-2.5 ml-px opacity-50" />
            {indicatorColor && indicatorColor !== "transparent" && (
              <span
                className="absolute -bottom-0.5 left-0.5 right-1 h-[2.5px] rounded-full"
                style={{ backgroundColor: indicatorColor }}
              />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <span className="font-medium">{label}</span>
        </TooltipContent>
      </Tooltip>

      {open && (
        <div
          className="absolute top-full left-0 z-50 mt-1 rounded-lg border border-border bg-card p-1 shadow-lg animate-in fade-in-0 zoom-in-95 duration-100"
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="color-picker-grid">
            {colors.map((c) => (
              <Tooltip key={c.value}>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(c.value)
                        setOpen(false)
                      }}
                      aria-label={c.label}
                      className="color-picker-swatch"
                      style={{
                        backgroundColor:
                          c.value === "transparent"
                            ? "var(--color-muted)"
                            : c.value,
                      }}
                    />
                  }
                />
                <TooltipContent>
                  <span className="font-medium text-xs">{c.label}</span>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Main Toolbar ───────────────────────────────────────────────── */

export function FormatterToolbar(props: FormatterToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [lastTextColor, setLastTextColor] = useState("#0f172a")
  const [lastHighlight, setLastHighlight] = useState("#fef08a")

  const handleTextColor = useCallback(
    (color: string) => {
      setLastTextColor(color)
      props.onTextColor(color)
    },
    [props]
  )

  const handleHighlight = useCallback(
    (color: string) => {
      setLastHighlight(color)
      props.onHighlight(color)
    },
    [props]
  )

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione um arquivo de imagem válido.")
      return
    }

    props.onUploadImage(file)
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const af = props.activeFormats

  return (
    <TooltipProvider delay={300} closeDelay={100}>
      <div
        className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1.5 backdrop-blur-sm"
        onMouseDown={(e) => e.preventDefault()}
      >
        {/* ─── Undo / Redo ─────────────────────────────────── */}
        <ToolbarGroup>
          <ToolbarButton onClick={props.onUndo} label="Desfazer" shortcut="⌘Z">
            <Undo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={props.onRedo} label="Refazer" shortcut="⌘⇧Z">
            <Redo2 className="h-4 w-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarSeparator />

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
          <ToolbarButton
            onClick={props.onBold}
            label="Negrito"
            shortcut="⌘B"
            active={af.bold}
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={props.onItalic}
            label="Itálico"
            shortcut="⌘I"
            active={af.italic}
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={props.onUnderline}
            label="Sublinhado"
            shortcut="⌘U"
            active={af.underline}
          >
            <Underline className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={props.onStrikethrough}
            label="Tachado"
            shortcut="⌘⇧S"
            active={af.strikeThrough}
          >
            <Strikethrough className="h-4 w-4" />
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

        {/* ─── Colors ────────────────────────────────────── */}
        <ToolbarGroup label="Cores">
          <ColorPickerDropdown
            colors={TEXT_COLORS}
            onSelect={handleTextColor}
            label="Cor do texto"
            icon={Paintbrush}
            indicatorColor={lastTextColor}
          />
          <ColorPickerDropdown
            colors={HIGHLIGHT_COLORS}
            onSelect={handleHighlight}
            label="Destaque"
            icon={Highlighter}
            indicatorColor={lastHighlight}
          />
        </ToolbarGroup>

        <ToolbarSeparator />

        {/* ─── Alignment ─────────────────────────────────── */}
        <ToolbarGroup label="Alinhamento">
          <ToolbarButton
            onClick={props.onAlignLeft}
            label="Alinhar à esquerda"
            active={af.justifyLeft}
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={props.onAlignCenter}
            label="Centralizar"
            active={af.justifyCenter}
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={props.onAlignRight}
            label="Alinhar à direita"
            active={af.justifyRight}
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={props.onAlignJustify}
            label="Justificar"
            active={af.justifyFull}
          >
            <AlignJustify className="h-4 w-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarSeparator />

        {/* ─── Listas e Blocos ────────────────────────────── */}
        <ToolbarGroup label="Bloco">
          <ToolbarButton
            onClick={props.onUl}
            label="Lista não ordenada"
            active={af.insertUnorderedList}
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={props.onOl}
            label="Lista ordenada"
            active={af.insertOrderedList}
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={props.onQuote} label="Citação">
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={props.onIndent} label="Recuar">
            <Indent className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={props.onOutdent} label="Diminuir recuo">
            <Outdent className="h-4 w-4" />
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
          <ToolbarButton
            onClick={props.onInstagram}
            label="Post do Instagram"
          >
            <InstagramIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={props.onFacebook} label="Post do Facebook">
            <FacebookIcon className="h-4 w-4" />
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
          <ToolbarButton onClick={props.onHr} label="Linha horizontal">
            <Minus className="h-4 w-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarSeparator />

        {/* ─── Limpar ────────────────────────────────────── */}
        <ToolbarGroup>
          <ToolbarButton onClick={props.onClearFormat} label="Limpar formatação">
            <RemoveFormatting className="h-4 w-4" />
          </ToolbarButton>
        </ToolbarGroup>
      </div>
    </TooltipProvider>
  )
}
