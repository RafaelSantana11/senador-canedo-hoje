"use client"

import { Badge } from "@/components/ui/badge"
import { assetPath } from "@/lib/utils"
import { renderMarkdown } from "./markdown-utils"

interface ArticlePreviewProps {
  title: string
  category: string
  author: string
  image: string
  urgent: boolean
  content: string
}

export function ArticlePreview(props: ArticlePreviewProps) {
  const { title, category, author, image, urgent, content } = props

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-card">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={assetPath(image)}
          alt=""
          className="h-56 w-full object-cover"
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.display = "none"
          }}
        />
      ) : (
        <div className="flex h-56 w-full items-center justify-center bg-muted text-xs text-muted-foreground">
          Imagem de capa
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{category}</Badge>
          {urgent && (
            <span className="text-xs font-semibold tracking-wide text-destructive uppercase">
              Urgente
            </span>
          )}
        </div>
        <h3 className="mt-3 text-2xl leading-tight font-semibold text-foreground">
          {title || "Título da matéria"}
        </h3>
        {author && (
          <p className="mt-2 text-xs text-muted-foreground">Por {author}</p>
        )}
        <div
          className="prose-basic mt-4 text-sm leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
        />
      </div>
    </article>
  )
}
