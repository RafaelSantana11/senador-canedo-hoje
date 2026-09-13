"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Check, Clock, FileText, Hash, ImagePlus } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { assetPath, cn } from "@/lib/utils"
import { FormatterToolbar, EMPTY_FORMATS, type ActiveFormats } from "./formatter-toolbar"
import { ImageUploader } from "./image-uploader"
import {
  embedPlaceholderHtml,
  htmlToMarkdown,
  isFacebookShareUrl,
  parseFacebookUrl,
  parseInstagramUrl,
  renderMarkdown,
  type EmbedKind,
} from "./markdown-utils"
import { usePromptText } from "./prompt-dialog-provider"

import {
  isValidSlug,
  NEWS_SLUG_MAX,
  NEWS_SUMMARY_MAX,
  NEWS_TITLE_MAX,
  type NewsPosition,
} from "@/features/admin/news/types/news"
import { uploadContentImage } from "@/features/admin/news/services/files-service"

function escapeAttr(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export type NewsFormTag = {
  id: string
  name: string
  color?: string | null
}

interface NewsFormProps {
  title: string
  setTitle: (val: string) => void
  summary: string
  setSummary: (val: string) => void
  slug: string
  setSlug: (val: string) => void
  category: string
  setCategory: (val: string) => void
  categories: string[]
  tags?: NewsFormTag[]
  selectedTagIds?: string[]
  setSelectedTagIds?: (ids: string[]) => void
  position?: NewsPosition
  setPosition?: (val: NewsPosition) => void
  positionOrder?: number
  setPositionOrder?: (val: number) => void
  image: string
  setImage: (val: string) => void
  coverCaption: string
  setCoverCaption: (val: string) => void
  coverCredit: string
  setCoverCredit: (val: string) => void
  urgent: boolean
  setUrgent: (val: boolean) => void
  content: string
  setContent: React.Dispatch<React.SetStateAction<string>>
}

const POSITION_LABELS: { value: NewsPosition; label: string }[] = [
  { value: "normal", label: "Padrão (Sem destaque fixo)" },
  { value: "destaque", label: "Destaque Principal" },
  { value: "topo", label: "Manchete do Topo" },
  { value: "feed", label: "Feed de Notícias" },
  { value: "lateral", label: "Barra Lateral" },
  { value: "rodape", label: "Rodapé" },
]

export function NewsForm({
  title,
  setTitle,
  summary,
  setSummary,
  slug,
  setSlug,
  category,
  setCategory,
  categories,
  tags,
  selectedTagIds,
  setSelectedTagIds,
  position = "normal",
  setPosition,
  positionOrder = 0,
  setPositionOrder,
  image,
  setImage,
  coverCaption,
  setCoverCaption,
  coverCredit,
  setCoverCredit,
  urgent,
  setUrgent,
  content,
  setContent,
}: NewsFormProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const lastContentRef = useRef<string | null>(null)
  const savedRangeRef = useRef<Range | null>(null)
  const [activeFormats, setActiveFormats] = useState<ActiveFormats>(EMPTY_FORMATS)
  const [isDragging, setIsDragging] = useState(false)
  const { promptText } = usePromptText()

  const slugError =
    slug.trim() && !isValidSlug(slug.trim())
      ? "Use apenas letras minúsculas, números e hífens (2 a 320 caracteres)."
      : null

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
  // No editor, posts do Instagram viram um cartão inerte; o embed real só é
  // montado na pré-visualização/página pública.
  useEffect(() => {
    if (lastContentRef.current === content) return
    lastContentRef.current = content
    if (editorRef.current) {
      editorRef.current.innerHTML =
        renderMarkdown(content, { embeds: "placeholder" }) || ""
    }
  }, [content])

  function syncFromEditor() {
    const el = editorRef.current
    if (!el) return
    const md = htmlToMarkdown(el.innerHTML)
    lastContentRef.current = md
    setContent(md)
  }

  const exec = useCallback(
    (command: string, value?: string) => {
      restoreSelection()
      document.execCommand(command, false, value)
      syncFromEditor()
      queryActiveFormats()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  function insertHtml(html: string) {
    restoreSelection()
    document.execCommand("insertHTML", false, html)
    syncFromEditor()
  }

  /* ─── Query active formatting state ──────────────────────────────── */

  function queryActiveFormats() {
    try {
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
        justifyLeft: document.queryCommandState("justifyLeft"),
        justifyCenter: document.queryCommandState("justifyCenter"),
        justifyRight: document.queryCommandState("justifyRight"),
        justifyFull: document.queryCommandState("justifyFull"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
        insertOrderedList: document.queryCommandState("insertOrderedList"),
      })
    } catch {
      // queryCommandState can throw in some edge cases
    }
  }

  /* ─── Command handlers ──────────────────────────────────────────── */

  function insertLink() {
    void (async () => {
      const url = await promptText({
        title: "Inserir link",
        description: "Cole a URL do link externo.",
        label: "URL do link",
        placeholder: "https://",
        defaultValue: "https://",
        confirmLabel: "Inserir link",
      })
      if (!url) return
      const range = savedRangeRef.current
      if (range && !range.collapsed) {
        exec("createLink", url)
      } else {
        insertHtml(`<a href="${escapeAttr(url)}">texto do link</a>`)
      }
    })()
  }

  function insertImage() {
    void (async () => {
      const url = await promptText({
        title: "Inserir imagem",
        description: "Cole a URL da imagem a ser inserida.",
        label: "URL da imagem",
        placeholder: "https://",
        defaultValue: "https://",
        confirmLabel: "Inserir imagem",
      })
      if (!url) return
      const alt = await promptText({
        title: "Texto alternativo da imagem",
        description: "Descreva a imagem para acessibilidade e SEO.",
        label: "Descrição da imagem",
        placeholder: "Ex: Vista aérea do centro de Senador Canedo",
        defaultValue: "imagem",
        confirmLabel: "Inserir imagem",
      })
      insertHtml(`<img src="${escapeAttr(url)}" alt="${escapeAttr(alt ?? "imagem")}" />`)
    })()
  }

  function insertUploadedImage(file: File) {
    void (async () => {
      const alt = await promptText({
        title: "Texto alternativo da imagem",
        description: "Descreva a imagem para acessibilidade e SEO.",
        label: "Descrição da imagem",
        placeholder: "Ex: Vista aérea do centro de Senador Canedo",
        defaultValue: "imagem",
        confirmLabel: "Inserir imagem",
      })
      if (!alt) return
      try {
        const src = await uploadContentImage(file)
        insertHtml(`<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" />`)
      } catch {
        alert("Não foi possível enviar a imagem. Tente novamente.")
      }
    })()
  }

  /** Insere o cartão do embed + um parágrafo depois, para o cursor continuar. */
  function insertEmbed(kind: EmbedKind, url: string) {
    insertHtml(embedPlaceholderHtml(kind, url) + "<p><br></p>")
  }

  /**
   * Normaliza links do Facebook. Links de compartilhamento
   * (`facebook.com/share/p/...`) não são aceitos pelo plugin de embed, então
   * são resolvidos para o permalink canônico pelo route handler do Next.
   */
  async function resolveFacebookPost(rawUrl: string): Promise<string | null> {
    const direct = parseFacebookUrl(rawUrl)
    if (!direct) return null
    if (!isFacebookShareUrl(direct)) return direct

    try {
      const response = await fetch(
        `${assetPath("/api/facebook/resolve")}?url=${encodeURIComponent(direct)}`
      )
      if (!response.ok) return null
      const data = (await response.json()) as { url?: string }
      return data.url ? parseFacebookUrl(data.url) : null
    } catch {
      return null
    }
  }

  function insertInstagram() {
    void (async () => {
      const url = await promptText({
        title: "Inserir post do Instagram",
        description:
          "Cole o link de um post, Reel ou IGTV. Ele será incorporado na matéria.",
        label: "Link do post",
        placeholder: "https://www.instagram.com/p/...",
        defaultValue: "https://www.instagram.com/",
        confirmLabel: "Inserir post",
      })
      if (!url) return

      const canonical = parseInstagramUrl(url)
      if (!canonical) {
        alert(
          "Link do Instagram inválido. Use o endereço de um post, Reel ou IGTV " +
            "(ex.: https://www.instagram.com/p/ABC123/)."
        )
        return
      }
      insertEmbed("instagram", canonical)
    })()
  }

  function insertFacebook() {
    void (async () => {
      const url = await promptText({
        title: "Inserir post do Facebook",
        description:
          "Cole o link de um post, vídeo ou Reel do Facebook. Ele será incorporado na matéria.",
        label: "Link do post",
        placeholder: "https://www.facebook.com/.../posts/...",
        defaultValue: "https://www.facebook.com/",
        confirmLabel: "Inserir post",
      })
      if (!url) return

      const canonical = await resolveFacebookPost(url)
      if (!canonical) {
        alert(
          "Não foi possível importar este link do Facebook. Confira se é um post, " +
            "vídeo ou Reel e tente de novo; se continuar, abra o post e copie o " +
            "endereço direto (ex.: https://www.facebook.com/pagina/posts/123...)."
        )
        return
      }
      insertEmbed("facebook", canonical)
    })()
  }

  /** Remove o cartão de embed ao clicar no botão "×" (delegação de evento). */
  function handleEditorClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement
    const removeButton = target.closest(".embed-remove")
    if (!removeButton) return
    e.preventDefault()
    const embed = removeButton.closest(".instagram-embed, .facebook-embed")
    if (!embed) return
    embed.remove()
    syncFromEditor()
  }

  function insertHorizontalRule() {
    insertHtml("<hr />")
  }

  function handleCode() {
    const range = savedRangeRef.current
    const text =
      range && !range.collapsed ? escapeAttr(range.toString()) : "código"
    insertHtml(`<code>${text}</code>`)
  }

  function handleTextColor(color: string) {
    exec("foreColor", color)
  }

  function handleHighlight(color: string) {
    if (color === "transparent") {
      exec("removeFormat")
    } else {
      exec("hiliteColor", color)
    }
  }

  function handleClearFormat() {
    exec("removeFormat")
  }

  /* ─── Drag & Drop images ────────────────────────────────────────── */

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true)
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find((f) => f.type.startsWith("image/"))
    if (!imageFile) return

    insertUploadedImage(imageFile)
  }

  /* ─── Clean paste handler ───────────────────────────────────────── */

  function handlePaste(e: React.ClipboardEvent) {
    // Colar o link de um post do Instagram/Facebook vira embed automaticamente.
    const text = e.clipboardData.getData("text/plain").trim()
    if (text && !text.includes(" ")) {
      const instagramUrl = parseInstagramUrl(text)
      if (instagramUrl) {
        e.preventDefault()
        insertEmbed("instagram", instagramUrl)
        return
      }
      // Links de share do Facebook precisam ser resolvidos antes de inserir.
      if (parseFacebookUrl(text)) {
        e.preventDefault()
        void (async () => {
          const canonical = await resolveFacebookPost(text)
          if (canonical) {
            insertEmbed("facebook", canonical)
          } else {
            alert(
              "Não foi possível importar este link do Facebook. Se for um link de " +
                "compartilhamento, abra o post e copie o endereço direto."
            )
          }
        })()
        return
      }
    }

    const html = e.clipboardData.getData("text/html")
    if (!html) return // let browser handle plain text paste

    e.preventDefault()

    // Create a temporary container to sanitize HTML
    const temp = document.createElement("div")
    temp.innerHTML = html

    // Remove Word/Google Docs artifacts
    temp.querySelectorAll("meta, style, script, link, title, o\\:p").forEach((el) => el.remove())

    // Strip class/id/style from all elements (keep href/src/alt)
    temp.querySelectorAll("*").forEach((el) => {
      const tag = el.tagName.toLowerCase()
      const allowedAttrs = ["href", "src", "alt", "target", "rel"]
      const attrs = Array.from(el.attributes)
      attrs.forEach((attr) => {
        if (!allowedAttrs.includes(attr.name)) {
          el.removeAttribute(attr.name)
        }
      })
      // Remove empty spans
      if (tag === "span" && !el.attributes.length && el.textContent) {
        el.replaceWith(document.createTextNode(el.textContent))
      }
    })

    const cleanHtml = temp.innerHTML
    document.execCommand("insertHTML", false, cleanHtml)
    syncFromEditor()
  }

  /* ─── Keyboard shortcuts ────────────────────────────────────────── */

  useEffect(() => {
    const el = editorRef.current
    if (!el) return

    function handleKeyDown(e: KeyboardEvent) {
      const isMeta = e.metaKey || e.ctrlKey
      if (!isMeta) return

      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault()
          exec("bold")
          break
        case "i":
          e.preventDefault()
          exec("italic")
          break
        case "u":
          e.preventDefault()
          exec("underline")
          break
        case "e":
          e.preventDefault()
          handleCode()
          break
        case "k":
          e.preventDefault()
          insertLink()
          break
        case "z":
          e.preventDefault()
          if (e.shiftKey) {
            exec("redo")
          } else {
            exec("undo")
          }
          break
        case "s":
          if (e.shiftKey) {
            e.preventDefault()
            exec("strikeThrough")
          }
          break
      }
    }

    el.addEventListener("keydown", handleKeyDown)
    return () => el.removeEventListener("keydown", handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exec])

  const stats = useMemo(() => {
    const text = content.trim()
    if (!text) return { chars: 0, words: 0, readingTime: 0 }
    const chars = text.length
    const words = text.split(/\s+/).filter(Boolean).length
    const readingTime = Math.max(1, Math.ceil(words / 200))
    return { chars, words, readingTime }
  }, [content])

  return (
    <Card className="overflow-hidden p-0">
      {/* ─── Section: Article info ────────────────────────── */}
      <div className="border-b border-border bg-muted/20 px-5 py-2">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          <FileText className="h-3.5 w-3.5" />
          Informações da matéria
        </div>
      </div>

      <div className="grid gap-4 px-3 py-1">
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="title">Título</Label>
            <span
              className={cn(
                "text-xs tabular-nums",
                title.length >= NEWS_TITLE_MAX
                  ? "font-medium text-amber-600"
                  : "text-muted-foreground"
              )}
            >
              {title.length}/{NEWS_TITLE_MAX}
            </span>
          </div>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da matéria"
            maxLength={NEWS_TITLE_MAX}
            className="text-base font-medium"
          />
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="summary">Subtítulo / linha fina</Label>
            <span
              className={cn(
                "text-xs tabular-nums",
                summary.length >= NEWS_SUMMARY_MAX
                  ? "font-medium text-amber-600"
                  : "text-muted-foreground"
              )}
            >
              {summary.length}/{NEWS_SUMMARY_MAX}
            </span>
          </div>
          <Textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Chamada exibida abaixo do título e usada pelos buscadores."
            maxLength={NEWS_SUMMARY_MAX}
            rows={3}
            className="resize-y"
          />
          <p className="text-xs text-muted-foreground">
            Se deixado em branco, geramos automaticamente a partir do conteúdo.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="slug">Link da matéria</Label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
              /noticia/
            </span>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="slug-da-materia"
              maxLength={NEWS_SLUG_MAX}
              aria-invalid={slugError ? true : undefined}
              className="pl-[4.5rem]"
            />
          </div>
          {slugError ? (
            <p className="text-xs text-destructive">{slugError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Gerado a partir do título. Edite para personalizar; em caso de
              conflito o servidor adiciona um sufixo.
            </p>
          )}
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
            <Label>Autor</Label>
            <Input
              value="Você (definido pelo usuário logado)"
              disabled
              className="text-muted-foreground"
            />
          </div>
        </div>

        {tags && tags.length > 0 && setSelectedTagIds && (
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Tags / Palavras-chave</Label>
              <span className="text-xs text-muted-foreground">
                {selectedTagIds?.length ?? 0}{" "}
                {selectedTagIds?.length === 1 ? "selecionada" : "selecionadas"}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-muted/20 p-2.5 min-h-[44px] items-center">
              {tags.map((t) => {
                const isSelected = selectedTagIds?.includes(t.id) ?? false
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedTagIds(selectedTagIds?.filter((id) => id !== t.id) ?? [])
                      } else {
                        setSelectedTagIds([...(selectedTagIds ?? []), t.id])
                      }
                    }}
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all border cursor-pointer",
                      isSelected
                        ? "shadow-xs ring-1 ring-primary/40 font-semibold"
                        : "opacity-65 hover:opacity-100 hover:scale-[1.02]"
                    )}
                    style={{
                      backgroundColor: isSelected
                        ? `${t.color || "#6366f1"}25`
                        : `${t.color || "#6366f1"}0d`,
                      color: t.color || "currentColor",
                      borderColor: isSelected
                        ? t.color || "currentColor"
                        : `${t.color || "#6366f1"}35`,
                    }}
                  >
                    <Hash className="h-3 w-3" />
                    <span>{t.name}</span>
                    {isSelected && <Check className="h-3 w-3 ml-0.5" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <ImageUploader value={image} onChange={setImage} label="Imagem de capa" />

        {image && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="coverCaption">Legenda da foto</Label>
              <Input
                id="coverCaption"
                value={coverCaption}
                onChange={(e) => setCoverCaption(e.target.value)}
                placeholder="Ex.: Vista aérea do centro da cidade"
                maxLength={280}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="coverCredit">Crédito da foto</Label>
              <Input
                id="coverCredit"
                value={coverCredit}
                onChange={(e) => setCoverCredit(e.target.value)}
                placeholder="Ex.: João Silva / Prefeitura"
                maxLength={160}
              />
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="position">Posição na Tela Principal</Label>
            <Select
              value={position}
              items={POSITION_LABELS}
              onValueChange={(v) => setPosition?.(v as NewsPosition)}
            >
              <SelectTrigger id="position">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POSITION_LABELS.map((pos) => (
                  <SelectItem key={pos.value} value={pos.value}>
                    {pos.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="positionOrder">
              Ordem de Prioridade {!(position === "feed" || position === "lateral") && <span className="text-xs text-muted-foreground font-normal">(apenas feed/lateral)</span>}
            </Label>
            <Input
              id="positionOrder"
              type="number"
              min={0}
              disabled={!(position === "feed" || position === "lateral")}
              value={positionOrder}
              onChange={(e) => setPositionOrder?.(Math.max(0, parseInt(e.target.value, 10) || 0))}
              placeholder="0 (primeiro), 1, 2..."
              className={!(position === "feed" || position === "lateral") ? "text-muted-foreground opacity-60" : ""}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3.5">
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
      </div>


      <div className="relative">
        <FormatterToolbar
          onBold={() => exec("bold")}
          onItalic={() => exec("italic")}
          onUnderline={() => exec("underline")}
          onStrikethrough={() => exec("strikeThrough")}
          onH1={() => exec("formatBlock", "h1")}
          onH2={() => exec("formatBlock", "h2")}
          onH3={() => exec("formatBlock", "h3")}
          onQuote={() => exec("formatBlock", "blockquote")}
          onUl={() => exec("insertUnorderedList")}
          onOl={() => exec("insertOrderedList")}
          onLink={insertLink}
          onImage={insertImage}
          onInstagram={insertInstagram}
          onFacebook={insertFacebook}
          onUploadImage={insertUploadedImage}
          onCode={handleCode}
          onHr={insertHorizontalRule}
          onAlignLeft={() => exec("justifyLeft")}
          onAlignCenter={() => exec("justifyCenter")}
          onAlignRight={() => exec("justifyRight")}
          onAlignJustify={() => exec("justifyFull")}
          onUndo={() => exec("undo")}
          onRedo={() => exec("redo")}
          onTextColor={handleTextColor}
          onHighlight={handleHighlight}
          onClearFormat={handleClearFormat}
          onIndent={() => exec("indent")}
          onOutdent={() => exec("outdent")}
          activeFormats={activeFormats}
        />

        {/* ─── Drag overlay ─────────────────────────────── */}
        <div className={cn("editor-drag-overlay", isDragging && "active")}>
          <div className="editor-drag-overlay-content">
            <ImagePlus className="h-8 w-8" />
            <span>Solte a imagem aqui</span>
          </div>
        </div>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          data-placeholder="Escreva o conteúdo da matéria..."
          onSelect={() => {
            saveSelection()
            queryActiveFormats()
          }}
          onKeyUp={queryActiveFormats}
          onMouseUp={queryActiveFormats}
          onClick={handleEditorClick}
          onBlur={() => {
            saveSelection()
            syncFromEditor()
          }}
          onInput={syncFromEditor}
          onPaste={handlePaste}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="editor-area min-h-[400px] resize-y overflow-auto px-5 py-4 text-foreground transition-shadow focus:outline-none focus-visible:ring-0"
        />

        {/* ─── Status bar ─────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-1.5 text-[11px] text-muted-foreground">
          <span>
            {stats.words} {stats.words === 1 ? "palavra" : "palavras"} ·{" "}
            {stats.chars} {stats.chars === 1 ? "caractere" : "caracteres"}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            ~{stats.readingTime} min de leitura
          </span>
        </div>
      </div>

    </Card>
  )
}
