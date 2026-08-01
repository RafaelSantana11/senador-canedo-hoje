"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/admin/admin-shell"
import { useAdminStore } from "@/components/admin/admin-store"

import { NewsForm } from "@/components/admin/news-editor/news-form"
import { ArticlePreview } from "@/components/admin/news-editor/article-preview"
import { generateExcerpt } from "@/components/admin/news-editor/markdown-utils"

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
  const [loaded, setLoaded] = useState(false)

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
        setLoaded(true)
      } else {
        toast.error("Notícia não encontrada.")
        router.push("/admin/noticias")
      }
    } else {
      setContent("")
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
      <PageHeader
        title={isEditing ? "Editar notícia" : "Nova notícia"}
        description={
          isEditing
            ? "Altere os dados da matéria e salve ou publique novamente."
            : "Crie e publique uma nova matéria com o editor de texto. O conteúdo é salvo em Markdown."
        }
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSaveDraft}>
              {isEditing ? "Salvar como rascunho" : "Salvar rascunho"}
            </Button>
            <Button onClick={handlePublish}>
              {isEditing ? "Salvar e publicar" : "Publicar"}
            </Button>
          </div>
        }
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
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
        <Card className="p-5">
          <Tabs defaultValue="preview">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Pré-visualização
              </h2>
              <TabsList>
                <TabsTrigger value="preview" className="gap-1.5">
                  <Eye className="h-3.5 w-3.5" /> Preview
                </TabsTrigger>
                <TabsTrigger value="source" className="gap-1.5">
                  <Pencil className="h-3.5 w-3.5" /> Markdown
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="preview" className="mt-4">
              <ArticlePreview
                title={title}
                category={category}
                author={author}
                image={image}
                urgent={urgent}
                content={content}
              />
            </TabsContent>

            <TabsContent value="source" className="mt-4">
              <pre className="max-h-[520px] overflow-auto rounded-md bg-muted p-4 font-mono text-xs leading-relaxed text-foreground">
                {content || "(vazio)"}
              </pre>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
