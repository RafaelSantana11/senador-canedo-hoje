"use client"

import { Clock } from "lucide-react"
import { CategoryBadge } from "@/features/portal/home/components/category-badge"
import { assetPath } from "@/lib/utils"
import { generateExcerpt } from "./markdown-utils"

interface ArticlePreviewProps {
  title: string
  category: string
  tags?: { id: string; name: string; color?: string | null }[]
  author: string
  image: string
  urgent: boolean
  content: string
  /** Subtítulo manual; quando vazio, gera a partir do conteúdo. */
  summary?: string
}

export function ArticlePreview(props: ArticlePreviewProps) {
  const { title, category, image, urgent, content, summary: manualSummary } = props
  const summary = manualSummary?.trim() || generateExcerpt(content)

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[16/10] overflow-hidden">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={assetPath(image)}
            alt=""
            className="size-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:opacity-90"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = "none"
            }}
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-muted text-xs text-muted-foreground">
            Imagem de capa
          </div>
        )}
        <CategoryBadge
          category={category}
          urgent={urgent}
          className="absolute top-3 left-3 shadow-sm"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-lg leading-snug font-bold text-balance text-foreground transition-colors group-hover:text-secondary">
          {title || "Título da matéria"}
        </h3>
        {summary && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {summary}
          </p>
        )}
        <div className="mt-auto flex items-center gap-1.5 pt-4 text-xs font-medium text-muted-foreground">
          <Clock className="size-3.5" />
          <span>há poucos instantes</span>
        </div>
      </div>
    </div>
  )
}
