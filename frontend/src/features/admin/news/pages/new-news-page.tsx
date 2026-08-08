"use client"

import { useEffect, useState } from "react"
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
import { useAdminStore } from "@/components/admin/admin-store"
import { cn } from "@/lib/utils"

import { NewsForm } from "@/components/admin/news-editor/news-form"
import { ArticlePreview } from "@/components/admin/news-editor/article-preview"
import { generateExcerpt } from "@/components/admin/news-editor/markdown-utils"
import { ArticlePage } from "@/features/admin/news/components/article-page"

export default function NewNewsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")

  const { ready, categories, articles, addArticle, updateArticle } =
    useAdminStore()

  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<string>("Geral")
  const [author, setAuthor] = useState("")
  const [image, setImage] = useState("")
  const [urgent, setUrgent] = useState(false)
  const [content, setContent] = useState("")
  const [createdAt, setCreatedAt] = useState("")
  const [loaded, setLoaded] = useState(false)
  const [previewTab, setPreviewTab] = useState("card")
  const [expanded, setExpanded] = useState(false)

  // Load article data when editing
  useEffect(() => {
    if (!ready || loaded) return

    if (editId) {
      const article = articles.find((a) => a.id === editId)
      if (article) {
        setTitle(article.title)
        setCategory(article.category)
        setAuthor(article.author)
        setImage(article.image)
        setUrgent(article.urgent)
        setContent(article.content || article.excerpt || "")
        setCreatedAt(article.createdAt)
        setLoaded(true)
      } else {
        toast.error("Notícia não encontrada.")
        router.push("/admin/noticias")
      }
    } else {
      setContent("")
      setCreatedAt("")
      setLoaded(true)
    }
  }, [ready, editId, articles, loaded, router])

  if (!ready || !loaded) return null

  const isEditing = !!editId

  /* ─── Save / Publish Handlers ───────────────────────────────────── */

  function handleSaveDraft() {
    if (!title.trim()) {
      toast.error("Informe um título para salvar o rascunho.")
      return
    }

    const data = {
      title,
      excerpt: generateExcerpt(content),
      content,
      category,
      image: image || "/news/hero-congress.png",
      author: author || "Redação",
      status: "Rascunho" as const,
      urgent,
    }

    if (isEditing && editId) {
      updateArticle(editId, data)
      toast.success("Rascunho atualizado.")
    } else {
      addArticle(data)
      toast.success("Rascunho salvo com sucesso.")
    }
    router.push("/admin/noticias")
  }

  function handlePublish() {
    if (!title.trim()) {
      toast.error("Informe um título.")
      return
    }
    if (!content.trim()) {
      toast.error("O conteúdo está vazio.")
      return
    }

    const data = {
      title,
      excerpt: generateExcerpt(content),
      content,
      category,
      image: image || "/news/hero-congress.png",
      author: author || "Redação",
      status: "Publicado" as const,
      urgent,
    }

    if (isEditing && editId) {
      updateArticle(editId, data)
      toast.success("Notícia atualizada com sucesso.")
    } else {
      addArticle(data)
      toast.success("Notícia publicada com sucesso.")
    }
    router.push("/admin/noticias")
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
              categories={categories}
              author={author}
              setAuthor={setAuthor}
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
