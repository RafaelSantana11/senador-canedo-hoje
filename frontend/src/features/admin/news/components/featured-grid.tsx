import { Clock } from "lucide-react"
import Link from "next/link"
import { CategoryBadge } from "@/features/admin/news/components/category-badge"
import { featuredArticles } from "@/lib/news-data"
import { slugify } from "@/lib/articles-store"
import { assetPath } from "@/lib/utils"

export function FeaturedGrid() {
  return (
    <section aria-labelledby="destaques-heading">
      <div className="mb-5 flex items-center justify-between">
        <h2
          id="destaques-heading"
          className="flex items-center gap-2.5 font-serif text-xl font-bold text-primary"
        >
          <span
            className="inline-block h-6 w-1.5 rounded-full bg-secondary"
            aria-hidden
          />
          Em destaque
        </h2>
        <a
          href="#"
          className="text-sm font-medium text-secondary transition-colors hover:text-primary"
        >
          Ver tudo
        </a>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {featuredArticles.map((article) => (
          <Link
            key={article.id}
            href={`/noticia/${slugify(article.title)}`}
            className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <img
                src={assetPath(article.image || "/placeholder.svg")}
                alt=""
                className="size-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:opacity-90"
              />
              <CategoryBadge
                category={article.category}
                urgent={article.urgent}
                className="absolute top-3 left-3 shadow-sm"
              />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-serif text-lg leading-snug font-bold text-balance text-foreground transition-colors group-hover:text-secondary">
                {article.title}
              </h3>
              {article.excerpt && (
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {article.excerpt}
                </p>
              )}
              <div className="mt-auto flex items-center gap-1.5 pt-4 text-xs font-medium text-muted-foreground">
                <Clock className="size-3.5" />
                <span>{article.time}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
