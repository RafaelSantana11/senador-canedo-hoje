"use client"

import { useEffect, useRef } from "react"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FormatterToolbar } from "./formatter-toolbar"
import { ImageUploader } from "./image-uploader"
import { htmlToMarkdown, renderMarkdown } from "./markdown-utils"

function escapeAttr(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

interface NewsFormProps {
  title: string
  setTitle: (val: string) => void
  category: string
  setCategory: (val: string) => void
  categories: string[]
  author: string
  setAuthor: (val: string) => void
  image: string
  setImage: (val: string) => void
  urgent: boolean
  setUrgent: (val: boolean) => void
  content: string
  setContent: React.Dispatch<React.SetStateAction<string>>
}

export function NewsForm({
  title,
  setTitle,
  category,
  setCategory,
  categories,
  author,
  setAuthor,
  image,
  setImage,
  urgent,
  setUrgent,
  content,
  setContent,
}: NewsFormProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const lastContentRef = useRef<string | null>(null)
  const savedRangeRef = useRef<Range | null>(null)

  function saveSelection() {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0)
    }
  }

  function restoreSelection() {
    const el = editorRef.current
    const sel = window.getSelection()
    if (!el || !sel) return
    el.focus()
    if (savedRangeRef.current) {
      try {
        sel.removeAllRanges()
        sel.addRange(savedRangeRef.current)
      } catch {
        savedRangeRef.current = null
      }
    }
  }

  /* ─── Rich text editor (markdown under the hood) ────────────────── */

  // Sync external `content` (markdown) into the editor as rendered HTML.
  useEffect(() => {
    if (lastContentRef.current === content) return
    lastContentRef.current = content
    if (editorRef.current) {
      editorRef.current.innerHTML = renderMarkdown(content) || ""
    }
  }, [content])

  function syncFromEditor() {
    const el = editorRef.current
    if (!el) return
    const md = htmlToMarkdown(el.innerHTML)
    lastContentRef.current = md
    setContent(md)
  }

  function exec(command: string, value?: string) {
    restoreSelection()
    document.execCommand(command, false, value)
    syncFromEditor()
  }

  function insertHtml(html: string) {
    restoreSelection()
    document.execCommand("insertHTML", false, html)
    syncFromEditor()
  }

  function insertLink() {
    const url = window.prompt("URL do link:", "https://")
    if (!url) return
    const range = savedRangeRef.current
    if (range && !range.collapsed) {
      exec("createLink", url)
    } else {
      insertHtml(`<a href="${escapeAttr(url)}">texto do link</a>`)
    }
  }

  function insertImage() {
    const url = window.prompt("URL da imagem:", "https://")
    if (!url) return
    const alt = window.prompt("Texto alternativo:", "imagem") || "imagem"
    insertHtml(`<img src="${escapeAttr(url)}" alt="${escapeAttr(alt)}" />`)
  }

  function insertUploadedImage(dataUrl: string) {
    const alt = window.prompt("Texto alternativo da imagem:", "imagem") || "imagem"
    insertHtml(`<img src="${dataUrl}" alt="${escapeAttr(alt)}" />`)
  }

  function insertHorizontalRule() {
    insertHtml("<hr />")
  }

  function autoFormat() {
    const raw = content.replace(/\r\n/g, "\n")
    const lines = raw.split("\n").map((l) => l.replace(/[ \t]+$/g, ""))

    const blocks: string[] = []
    let buf: string[] = []
    const flush = () => {
      if (buf.length) {
        blocks.push(buf.join("\n"))
        buf = []
      }
    }
    for (const l of lines) {
      if (l.trim() === "") flush()
      else buf.push(l)
    }
    flush()

    const capitalizeSentences = (s: string) =>
      s.replace(/(^|[.!?]\s+)([a-zà-ú])/g, (_m, p, c) => p + c.toUpperCase())

    const fixPunctuation = (s: string) =>
      s
        .replace(/\s+([,.;:!?])/g, "$1")
        .replace(/([,.;:!?])(?=[A-Za-zÀ-ú])/g, "$1 ")
        .replace(/[ ]{2,}/g, " ")
        .replace(/\s+$/g, "")
        .trim()

    const formatted = blocks
      .map((b) => {
        const first = b.trimStart()
        if (/^(#{1,6}\s|[-*]\s|\d+\.\s|>\s?|---)/.test(first)) {
          return b
            .split("\n")
            .map((ln) => {
              const m = ln.match(/^(\s*(?:#{1,6}\s|[-*]\s|\d+\.\s|>\s?))(.*)$/)
              if (!m) return fixPunctuation(ln)
              return m[1] + capitalizeSentences(fixPunctuation(m[2]))
            })
            .join("\n")
        }
        const joined = b.replace(/\n+/g, " ")
        return capitalizeSentences(fixPunctuation(joined))
      })
      .filter(Boolean)
      .join("\n\n")

    if (formatted === content) {
      toast("Conteúdo já está formatado.")
      return
    }
    lastContentRef.current = formatted
    setContent(formatted)
    if (editorRef.current) {
      editorRef.current.innerHTML = renderMarkdown(formatted) || ""
    }
    toast.success("Conteúdo formatado automaticamente.")
  }

  return (
    <Card className="p-5">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da matéria"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={(v) => v && setCategory(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="author">Autor</Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Nome do autor"
            />
          </div>
        </div>

        <ImageUploader value={image} onChange={setImage} label="Imagem de capa" />

        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <Label htmlFor="urgent" className="text-sm">
              Marcar como urgente
            </Label>
            <p className="text-xs text-muted-foreground">
              Destaca a matéria com selo vermelho.
            </p>
          </div>
          <Switch id="urgent" checked={urgent} onCheckedChange={setUrgent} />
        </div>

        <Separator />

        {/* ─── Rich text editor ─────────────────────────────── */}
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label>Conteúdo</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={autoFormat}
              className="h-8 gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" /> Formatar automaticamente
            </Button>
          </div>
          <div className="rounded-md border border-border">
            <FormatterToolbar
              onBold={() => exec("bold")}
              onItalic={() => exec("italic")}
              onH1={() => exec("formatBlock", "h1")}
              onH2={() => exec("formatBlock", "h2")}
              onH3={() => exec("formatBlock", "h3")}
              onQuote={() => exec("formatBlock", "blockquote")}
              onUl={() => exec("insertUnorderedList")}
              onOl={() => exec("insertOrderedList")}
              onLink={insertLink}
              onImage={insertImage}
              onUploadImage={insertUploadedImage}
              onCode={() => {
                const range = savedRangeRef.current
                const text =
                  range && !range.collapsed ? escapeAttr(range.toString()) : "código"
                insertHtml(`<code>${text}</code>`)
              }}
              onHr={insertHorizontalRule}
            />
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-multiline="true"
              data-placeholder="Escreva o conteúdo da matéria..."
              onSelect={saveSelection}
              onBlur={() => {
                saveSelection()
                syncFromEditor()
              }}
              onInput={syncFromEditor}
              className="min-h-[320px] resize-y overflow-auto rounded-none border-0 px-3 py-2 text-sm leading-relaxed text-foreground focus:outline-none focus-visible:ring-0"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Use os botões de formatação para editar a matéria. O conteúdo é
            salvo e publicado automaticamente em Markdown.
          </p>
        </div>
      </div>
    </Card>
  )
}
