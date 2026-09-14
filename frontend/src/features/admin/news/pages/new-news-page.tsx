"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ChevronRight,
  Eye,
  FileText,
  Loader2,
  Maximize2,
  Minimize2,
  Newspaper,
  Pencil,
  Send,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PageHeader } from "@/components/admin/admin-shell"
import { cn } from "@/lib/utils"

import { useCategories } from "@/features/admin/categories/hooks/use-categories"
import { useTags } from "@/features/admin/tags/hooks/use-tags"
import type { Daum as TagItem } from "@/features/admin/tags/types/tag"
import { useNewsBySlug } from "@/features/admin/news/hooks/use-news-by-slug"
import { useCreateNews } from "@/features/admin/news/hooks/use-create-news"
import { useUpdateNews } from "@/features/admin/news/hooks/use-update-news"
import { uploadCover } from "@/features/admin/news/services/files-service"
import {
  formatNewsContent,
  FormatNewsError,
} from "@/features/admin/news/services/format-news-service"
import { newsApiErrorMessage } from "@/features/admin/news/utils/api-error"
import {
  isValidSlug,
  readCoverCaption,
  readCoverCredit,
  readPosition,
  readPositionOrder,
  readUrgent,
  slugify,
  type News,
  type NewsCategory,
  type NewsPayload,
  type NewsPosition,
  type NewsStatus,
} from "@/features/admin/news/types/news"

import { NewsForm } from "@/components/admin/news-editor/news-form"
import { PromptProvider } from "@/components/admin/news-editor/prompt-dialog-provider"
import { ArticlePreview } from "@/components/admin/news-editor/article-preview"
import { generateExcerpt } from "@/components/admin/news-editor/markdown-utils"
import { ArticlePage } from "@/features/portal/news/components/article-page"

const FORMAT_ERROR_MESSAGES: Record<string, string> = {
  missingApiKey:
    "IA não configurada. Crie uma chave grátis em aistudio.google.com/apikey, defina GEMINI_API_KEY no .env e reinicie o servidor.",
  emptyContent: "Escreva o conteúdo antes de formatar.",
  contentTooLong: "O conteúdo é longo demais para formatar de uma vez.",
  providerError: "A IA não conseguiu formatar agora. Tente novamente.",
  providerUnreachable:
    "Não foi possível falar com a IA. Verifique a conexão e tente novamente.",
  emptyResult: "A IA não devolveu texto. Tente novamente.",
  networkError: "Falha de rede ao chamar a IA. Tente novamente.",
}

export default function NewNewsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editSlug = searchParams.get("edit")

  const { data: categoriesData } = useCategories()
  const categories = useMemo(() => categoriesData?.data ?? [], [categoriesData])
  const categoryNames = useMemo(
    () => categories.map((c) => c.name),
    [categories]
  )

  const { data: tagsData } = useTags()
  const tags = useMemo(() => tagsData?.data ?? [], [tagsData])

  const { data: news, isLoading, error } = useNewsBySlug(editSlug)

  // Missing news on edit → back to the list
  useEffect(() => {
    if (editSlug && error) {
      toast.error("Notícia não encontrada.")
      router.push("/admin/noticias")
    }
  }, [editSlug, error, router])

  if (isLoading || (!editSlug && (!categoriesData || !tagsData))) return null

  return (
    <NewsEditor
      key={news?.id ?? "new"}
      news={news ?? null}
      categories={categories}
      categoryNames={categoryNames}
      tags={tags}
    />
  )
}

function NewsEditor({
  news,
  categories,
  categoryNames,
  tags,
}: {
  news: News | null
  categories: NewsCategory[]
  categoryNames: string[]
  tags: TagItem[]
}) {
  const router = useRouter()

  const createNews = useCreateNews()
  const updateNews = useUpdateNews()

  const isEditing = Boolean(news)

  const [title, setTitle] = useState(news?.title ?? "")
  const [summary, setSummary] = useState(news?.summary ?? "")
  // `slugInput` guarda o slug editado à mão; `null` = gerado do título.
  // Em edição o slug existente é preservado como valor manual.
  const [slugInput, setSlugInput] = useState<string | null>(news?.slug ?? null)
  const slug = slugInput ?? slugify(title)
  const [category, setCategory] = useState(
    news?.category.name ?? categoryNames[0] ?? ""
  )
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(() =>
    news?.tags ? news.tags.map((t) => t.id) : []
  )
  const [position, setPosition] = useState<NewsPosition>(
    news ? readPosition(news.config) : "normal"
  )
  const [positionOrder, setPositionOrder] = useState<number>(
    news ? readPositionOrder(news.config) : 0
  )
  const [author] = useState(news?.author.name ?? "Redação")
  const [image, setImage] = useState(news?.cover?.path ?? "")
  const [coverId] = useState<string | null>(news?.cover?.id ?? null)
  const [coverCaption, setCoverCaption] = useState(
    news ? readCoverCaption(news.config) : ""
  )
  const [coverCredit, setCoverCredit] = useState(
    news ? readCoverCredit(news.config) : ""
  )
  const [config] = useState<Record<string, unknown> | null>(
    news?.config ?? null
  )
  const [urgent, setUrgent] = useState(news ? readUrgent(news.config) : false)
  const [content, setContent] = useState(news?.body ?? "")
  const [publishedAt] = useState(news?.publishedAt ?? news?.createdAt ?? "")
  const [previewTab, setPreviewTab] = useState("card")
  const [expanded, setExpanded] = useState(false)
  const [unpublishConfirm, setUnpublishConfirm] = useState(false)
  const [publishChecklist, setPublishChecklist] = useState<string[] | null>(
    null
  )
  const [formatting, setFormatting] = useState(false)

  function handleSlugChange(value: string) {
    setSlugInput(value.trim().length > 0 ? value : null)
  }

  /** Manda o texto atual para a IA e substitui pelo Markdown formatado. */
  async function handleFormatWithAi() {
    if (!content.trim()) {
      toast.error("Escreva o conteúdo antes de formatar.")
      return
    }

    setFormatting(true)
    try {
      const formatted = await formatNewsContent({ content, title, summary })
      setContent(formatted)
      toast.success("Conteúdo formatado com IA.")
    } catch (error) {
      const code = error instanceof FormatNewsError ? error.code : ""
      toast.error(
        FORMAT_ERROR_MESSAGES[code] ??
          "Não foi possível formatar o conteúdo."
      )
    } finally {
      setFormatting(false)
    }
  }

  const selectedTags = useMemo(
    () => tags.filter((t) => selectedTagIds.includes(t.id)),
    [tags, selectedTagIds]
  )

  const previewArticle = {
    title,
    category,
    tags: selectedTags,
    author,
    image,
    urgent,
    content,
    excerpt: summary.trim() || generateExcerpt(content),
    publishedAt: publishedAt || undefined,
    coverCaption: coverCaption.trim() || undefined,
    coverCredit: coverCredit.trim() || undefined,
  }

  /* ─── Save / Publish Handlers ───────────────────────────────────── */

  function categoryId(): { id: string } {
    const found = categories.find((c) => c.name === category)
    if (found) return { id: found.id }
    return { id: categories[0]?.id ?? "" }
  }

  function buildConfig(): Record<string, unknown> {
    const next: Record<string, unknown> = { ...(config ?? {}), urgent }

    if (coverCaption.trim()) next.coverCaption = coverCaption.trim()
    else delete next.coverCaption
    if (coverCredit.trim()) next.coverCredit = coverCredit.trim()
    else delete next.coverCredit

    if (position !== "normal") {
      next.position = position
      if (position === "feed" || position === "lateral") {
        next.positionOrder = positionOrder
      } else {
        delete next.positionOrder
      }
    } else {
      delete next.position
      delete next.positionOrder
    }
    return next
  }

  async function resolveCover(): Promise<{ id: string } | null> {
    if (!image) return null
    if (image.startsWith("data:")) {
      const blob = await fetch(image).then((r) => r.blob())
      const file = new File([blob], "capa.png", { type: "image/png" })
      const uploaded = await uploadCover(file)
      return { id: uploaded.id }
    }
    return coverId ? { id: coverId } : null
  }

  function guardCategory() {
    if (!categories.length) {
      toast.error("Nenhuma categoria cadastrada. Cadastre uma antes de salvar.")
      return false
    }
    return true
  }

  function validateCommonFields(): boolean {
    if (!title.trim()) {
      toast.error("Informe um título.")
      return false
    }
    const trimmedSlug = slug.trim()
    if (trimmedSlug && !isValidSlug(trimmedSlug)) {
      toast.error(
        "O link da matéria é inválido. Use apenas letras minúsculas, números e hífens."
      )
      return false
    }
    return guardCategory()
  }

  function missingPublishItems(): string[] {
    const missing: string[] = []
    if (!image) missing.push("Imagem de capa")
    if (!summary.trim())
      missing.push("Subtítulo / linha fina (seria gerado automaticamente)")
    if (selectedTagIds.length === 0) missing.push("Tags / palavras-chave")
    return missing
  }

  async function buildPayload(status: NewsStatus): Promise<NewsPayload> {
    const cover = await resolveCover()
    const trimmedSlug = slug.trim()
    return {
      title: title.trim(),
      // Slug em branco (input nulo) deixa o servidor gerar, com sufixo de unicidade.
      slug: slugInput && trimmedSlug ? trimmedSlug : undefined,
      summary: summary.trim() || generateExcerpt(content),
      body: content,
      status,
      category: categoryId(),
      tags: selectedTagIds.map((id) => ({ id })),
      cover,
      config: buildConfig(),
    }
  }

  function handleSaveDraft() {
    if (!validateCommonFields()) return

    // Salvar rascunho em matéria publicada é despublicar — confirma antes.
    if (isEditing && news?.status === "published") {
      setUnpublishConfirm(true)
      return
    }
    void saveDraft(false)
  }

  async function saveDraft(wasPublished: boolean) {
    try {
      const payload = await buildPayload("draft")

      if (isEditing && news) {
        await updateNews.mutateAsync({ id: news.id, payload })
        toast.success(
          wasPublished
            ? "Matéria retirada do ar e salva como rascunho."
            : "Rascunho atualizado."
        )
      } else {
        await createNews.mutateAsync(payload)
        toast.success("Rascunho salvo com sucesso.")
      }
      router.push("/admin/noticias")
    } catch (error) {
      toast.error(
        newsApiErrorMessage(error) ?? "Não foi possível salvar o rascunho."
      )
    }
  }

  function handlePublish() {
    if (!validateCommonFields()) return
    if (!content.trim()) {
      toast.error("O conteúdo está vazio.")
      return
    }

    const missing = missingPublishItems()
    if (missing.length > 0) {
      setPublishChecklist(missing)
      return
    }
    void publish()
  }

  async function publish() {
    try {
      const payload = await buildPayload("published")

      if (isEditing && news) {
        await updateNews.mutateAsync({ id: news.id, payload })
        toast.success("Notícia atualizada com sucesso.")
      } else {
        await createNews.mutateAsync(payload)
        toast.success("Notícia publicada com sucesso.")
      }
      router.push("/admin/noticias")
    } catch (error) {
      toast.error(
        newsApiErrorMessage(error) ?? "Não foi possível publicar a notícia."
      )
    }
  }

  return (
    <div className="p-4 lg:p-6">
      {/* ─── Breadcrumb ─────────────────────────────────────── */}
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <button
          onClick={() => router.push("/admin")}
          className="transition-colors hover:text-foreground"
        >
          Painel
        </button>
        <ChevronRight className="h-3 w-3" />
        <button
          onClick={() => router.push("/admin/noticias")}
          className="transition-colors hover:text-foreground"
        >
          Notícias
        </button>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-foreground">
          {isEditing ? "Editar" : "Nova matéria"}
        </span>
      </nav>

      <PageHeader
        title={isEditing ? "Editar notícia" : "Nova notícia"}
        description={
          isEditing
            ? "Altere os dados da matéria e salve ou publique novamente."
            : "Crie e publique uma nova matéria com o editor de texto. O conteúdo é salvo em Markdown."
        }
        action={
          <div className="flex items-center gap-2">
            {isEditing && (
              <Badge
                variant="secondary"
                className="mr-1 gap-1 border border-primary/20 bg-primary/5 text-primary"
              >
                <Pencil className="h-3 w-3" />
                Editando
              </Badge>
            )}
            <Button
              variant="outline"
              onClick={handleFormatWithAi}
              disabled={formatting}
              title="Reescreve o conteúdo em Markdown jornalístico usando IA"
              className="gap-1.5"
            >
              {formatting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {formatting ? "Formatando..." : "Formatar com IA"}
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              className="gap-1.5"
            >
              <FileText className="h-4 w-4" />
              {isEditing ? "Salvar rascunho" : "Rascunho"}
            </Button>
            <Button
              onClick={handlePublish}
              className="gap-1.5 bg-gradient-to-r from-primary to-secondary shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30"
            >
              <Send className="h-4 w-4" />
              {isEditing ? "Salvar e publicar" : "Publicar"}
            </Button>
          </div>
        }
      />

      <div className="mt-6">
        {expanded ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="sticky top-0 z-[60] flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-4 py-3">
              <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Página da matéria
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpanded(false)}
              >
                <Minimize2 /> Fechar visualização
              </Button>
            </div>
            <ArticlePage preview article={previewArticle} />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            {/* ─── EDITOR FORM ────────────────────────────────────────── */}
            <PromptProvider>
              <NewsForm
                title={title}
                setTitle={setTitle}
                summary={summary}
                setSummary={setSummary}
                slug={slug}
                setSlug={handleSlugChange}
                category={category}
                setCategory={setCategory}
                categories={categoryNames}
                tags={tags}
                selectedTagIds={selectedTagIds}
                setSelectedTagIds={setSelectedTagIds}
                position={position}
                setPosition={setPosition}
                positionOrder={positionOrder}
                setPositionOrder={setPositionOrder}
                image={image}
                setImage={setImage}
                coverCaption={coverCaption}
                setCoverCaption={setCoverCaption}
                coverCredit={coverCredit}
                setCoverCredit={setCoverCredit}
                urgent={urgent}
                setUrgent={setUrgent}
                content={content}
                setContent={setContent}
              />
            </PromptProvider>

            {/* ─── PREVIEW CARD ───────────────────────────────────────── */}
            <Card className="overflow-hidden p-0">
              <Tabs value={previewTab} onValueChange={setPreviewTab}>
                <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/20 px-5 py-3">
                  <h2 className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    <Eye className="h-3.5 w-3.5" />
                    Pré-visualização
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <TabsList>
                      <TabsTrigger value="card" className="gap-1.5">
                        <Eye className="h-3.5 w-3.5" /> Card
                      </TabsTrigger>
                      <TabsTrigger value="page" className="gap-1.5">
                        <Newspaper className="h-3.5 w-3.5" /> Página
                      </TabsTrigger>
                    </TabsList>
                    {previewTab === "page" && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setExpanded(true)}
                        aria-label="Abrir a página da matéria em largura total"
                        title="Abrir em largura total"
                      >
                        <Maximize2 />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="px-3 py-1">
                  <TabsContent value="card" className="mt-0">
                    <ArticlePreview
                      title={title}
                      category={category}
                      tags={selectedTags}
                      author={author}
                      image={image}
                      urgent={urgent}
                      content={content}
                      summary={summary}
                    />
                  </TabsContent>

                  <TabsContent value="page" className="mt-0">
                    <div
                      className={cn(
                        "overflow-auto rounded-lg border border-border bg-background",
                        "max-h-[600px]"
                      )}
                    >
                      <ArticlePage preview article={previewArticle} />
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </Card>
          </div>
        )}
      </div>

      {/* ─── Confirmação: despublicar via rascunho ──────────────── */}
      <AlertDialog open={unpublishConfirm} onOpenChange={setUnpublishConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirar a matéria do ar?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta matéria está publicada. Salvar como rascunho vai retirá-la do
              ar imediatamente — o link público deixa de funcionar até que ela
              seja publicada novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setUnpublishConfirm(false)
                void saveDraft(true)
              }}
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
            >
              Retirar do ar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Checklist pré-publicação ───────────────────────────── */}
      <AlertDialog
        open={publishChecklist !== null}
        onOpenChange={(open) => !open && setPublishChecklist(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Publicar sem completar a matéria?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Os itens abaixo ainda não foram preenchidos:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {publishChecklist?.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar e completar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setPublishChecklist(null)
                void publish()
              }}
            >
              Publicar mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
