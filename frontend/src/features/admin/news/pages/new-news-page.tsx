"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ChevronRight,
  Eye,
  FileText,
  Maximize2,
  Minimize2,
  Newspaper,
  Pencil,
  Send,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  readPosition,
  readPositionOrder,
  readUrgent,
  type News,
  type NewsCategory,
  type NewsPayload,
  type NewsPosition,
} from "@/features/admin/news/types/news"

import { NewsForm } from "@/components/admin/news-editor/news-form"
import { ArticlePreview } from "@/components/admin/news-editor/article-preview"
import { generateExcerpt } from "@/components/admin/news-editor/markdown-utils"
import { ArticlePage } from "@/features/portal/news/components/article-page"

export default function NewNewsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editSlug = searchParams.get("edit")

  const { data: categoriesData } = useCategories()
  const categories = useMemo(() => categoriesData?.data ?? [], [categoriesData])
  const categoryNames = useMemo(() => categories.map((c) => c.name), [categories])

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
  const [category, setCategory] = useState(news?.category.name ?? categoryNames[0] ?? "")
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(() =>
    news?.tags ? news.tags.map((t) => t.id) : []
  )
  const [position, setPosition] = useState<NewsPosition>(news ? readPosition(news.config) : "normal")
  const [positionOrder, setPositionOrder] = useState<number>(news ? readPositionOrder(news.config) : 0)
  const [author] = useState(news?.author.name ?? "Redação")
  const [image, setImage] = useState(news?.cover?.path ?? "")
  const [coverId] = useState<string | null>(news?.cover?.id ?? null)
  const [config] = useState<Record<string, unknown> | null>(news?.config ?? null)
  const [urgent, setUrgent] = useState(news ? readUrgent(news.config) : false)
  const [content, setContent] = useState(news?.body ?? "")
  const [createdAt] = useState(news?.createdAt ?? "")
  const [previewTab, setPreviewTab] = useState("card")
  const [expanded, setExpanded] = useState(false)

  const selectedTags = useMemo(
    () => tags.filter((t) => selectedTagIds.includes(t.id)),
    [tags, selectedTagIds]
  )

  /* ─── Save / Publish Handlers ───────────────────────────────────── */

  function categoryId(): { id: string } {
    const found = categories.find((c) => c.name === category)
    if (found) return { id: found.id }
    return { id: categories[0]?.id ?? "" }
  }

  function buildConfig(): Record<string, unknown> {
    const next: Record<string, unknown> = { ...(config ?? {}), urgent }
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

  async function handleSaveDraft() {
    if (!title.trim()) {
      toast.error("Informe um título para salvar o rascunho.")
      return
    }
    if (!guardCategory()) return

    try {
      const cover = await resolveCover()
      const payload: NewsPayload = {
        title: title.trim(),
        summary: generateExcerpt(content),
        body: content,
        status: "draft",
        category: categoryId(),
        tags: selectedTagIds.map((id) => ({ id })),
        cover,
        config: buildConfig(),
      }

      if (isEditing && news) {
        await updateNews.mutateAsync({ id: news.id, payload })
        toast.success("Rascunho atualizado.")
      } else {
        await createNews.mutateAsync(payload)
        toast.success("Rascunho salvo com sucesso.")
      }
      router.push("/admin/noticias")
    } catch {
      toast.error("Não foi possível salvar o rascunho.")
    }
  }

  async function handlePublish() {
    if (!title.trim()) {
      toast.error("Informe um título.")
      return
    }
    if (!content.trim()) {
      toast.error("O conteúdo está vazio.")
      return
    }
    if (!guardCategory()) return

    try {
      const cover = await resolveCover()
      const payload: NewsPayload = {
        title: title.trim(),
        summary: generateExcerpt(content),
        body: content,
        status: "published",
        category: categoryId(),
        tags: selectedTagIds.map((id) => ({ id })),
        cover,
        config: buildConfig(),
      }

      if (isEditing && news) {
        await updateNews.mutateAsync({ id: news.id, payload })
        toast.success("Notícia atualizada com sucesso.")
      } else {
        await createNews.mutateAsync(payload)
        toast.success("Notícia publicada com sucesso.")
      }
      router.push("/admin/noticias")
    } catch {
      toast.error("Não foi possível publicar a notícia.")
    }
  }

  return (
    <div className="p-6 lg:p-10">
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
            <ArticlePage
              preview
              article={{
                title,
                category,
                tags: selectedTags,
                author,
                image,
                urgent,
                content,
                excerpt: generateExcerpt(content),
                createdAt: createdAt || undefined,
              }}
            />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            {/* ─── EDITOR FORM ────────────────────────────────────────── */}
            <NewsForm
              title={title}
              setTitle={setTitle}
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
              urgent={urgent}
              setUrgent={setUrgent}
              content={content}
              setContent={setContent}
            />

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

                <div className="p-5">
                  <TabsContent value="card" className="mt-0">
                    <ArticlePreview
                      title={title}
                      category={category}
                      tags={selectedTags}
                      author={author}
                      image={image}
                      urgent={urgent}
                      content={content}
                    />
                  </TabsContent>

                  <TabsContent value="page" className="mt-0">
                    <div
                      className={cn(
                        "overflow-auto rounded-lg border border-border bg-background",
                        "max-h-[600px]"
                      )}
                    >
                      <ArticlePage
                        preview
                        article={{
                          title,
                          category,
                          tags: selectedTags,
                          author,
                          image,
                          urgent,
                          content,
                          excerpt: generateExcerpt(content),
                          createdAt: createdAt || undefined,
                        }}
                      />
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
