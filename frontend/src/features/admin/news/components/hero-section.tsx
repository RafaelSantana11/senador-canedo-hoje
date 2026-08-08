import { Clock } from "lucide-react"
import Link from "next/link"
import { CategoryBadge } from "@/features/admin/news/components/category-badge"
import { heroArticle, featuredArticles } from "@/lib/news-data"
import { slugify } from "@/lib/articles-store"
import { assetPath } from "@/lib/utils"

export function HeroSection() {
  const secondary = featuredArticles.slice(0, 2)

  return (
    <section
      className="grid gap-6 lg:grid-cols-3"
      aria-label="Notícia em destaque"
    >
      {/* Main hero */}
      <Link
        href={`/noticia/${slugify(heroArticle.title)}`}
        className="group relative col-span-1 overflow-hidden rounded-2xl shadow-sm ring-1 ring-border transition-shadow hover:shadow-xl lg:col-span-2"
      >
        <div className="relative w-full overflow-hidden">
          <img
            src={assetPath(heroArticle.image || "/placeholder.svg")}
            alt=""
            className="size-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:opacity-90"
          />
          <div className="absolute inset-0 bg-linear-to-t from-primary/20 via-primary/10 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
          <CategoryBadge
            category={heroArticle.category}
            urgent={heroArticle.urgent}
          />
          <h1 className="mt-3 font-serif text-2xl leading-tight font-bold text-balance text-white sm:text-3xl md:text-4xl">
            {heroArticle.title}
          </h1>
          <p className="mt-3 hidden max-w-2xl text-sm leading-relaxed text-white/85 sm:block md:text-base">
            {heroArticle.excerpt}
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-white/80">
            <Clock className="size-3.5" />
            <span>{heroArticle.time}</span>
            <span aria-hidden>•</span>
            <span>{heroArticle.author}</span>
          </div>
        </div>
      </Link>

      {/* Secondary stack */}
      <div className="flex flex-col gap-6">
        {secondary.map((article) => (
          <Link
            key={article.id}
            href={`/noticia/${slugify(article.title)}`}
            className="group relative flex-1 overflow-hidden rounded-2xl shadow-sm ring-1 ring-border transition-shadow hover:shadow-lg"
          >
            <div className="relative h-40 w-full overflow-hidden lg:h-full lg:min-h-[9rem]">
              <img
                src={assetPath(article.image || "/placeholder.svg")}
                alt=""
                className="size-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:opacity-90"
              />
              <div className="absolute inset-0 bg-linear-to-t from-primary/50 via-primary/30 to-transparent" />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-4">
              <CategoryBadge category={article.category} />
              <h2 className="mt-2 font-serif text-base leading-snug font-bold text-balance text-primary-foreground md:text-lg">
                {article.title}
              </h2>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-primary-foreground/80">
                <Clock className="size-3" />
                <span>{article.time}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
