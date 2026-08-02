import { Clock, TrendingUp } from "lucide-react"
import { AdBanner } from "@/components/news/ad-banner"
import { mostRead, latestNews } from "@/lib/news-data"

export function NewsSidebar() {
  return (
    <aside className="flex flex-col gap-8" aria-label="Conteúdo complementar">
      {/* Mais lidas */}
      <section
        className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border"
        aria-labelledby="mais-lidas-heading"
      >
        <div className="flex items-center gap-2 border-b border-border bg-primary px-5 py-3.5 text-primary-foreground">
          <TrendingUp className="size-4" />
          <h2 id="mais-lidas-heading" className="font-serif text-lg font-bold">
            Mais lidas
          </h2>
        </div>
        <ol className="divide-y divide-border">
          {mostRead.map((article, i) => (
            <li key={article.id}>
              <a
                href="#"
                className="group flex items-start gap-3.5 px-5 py-4 transition-colors hover:bg-muted/60"
              >
                <span className="font-serif text-2xl leading-none font-bold text-accent">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <span className="text-xs font-semibold tracking-wide text-secondary uppercase">
                    {article.category}
                  </span>
                  <h3 className="mt-0.5 text-sm leading-snug font-semibold text-foreground transition-colors group-hover:text-secondary">
                    {article.title}
                  </h3>
                </div>
              </a>
            </li>
          ))}
        </ol>
      </section>

      <AdBanner size="box" />

      {/* Últimas notícias */}
      <section
        className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border"
        aria-labelledby="ultimas-heading"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2
            id="ultimas-heading"
            className="flex items-center gap-2 font-serif text-lg font-bold text-primary"
          >
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive/60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-destructive" />
            </span>
            Últimas notícias
          </h2>
        </div>
        <ul className="divide-y divide-border">
          {latestNews.map((article) => (
            <li key={article.id}>
              <a
                href="#"
                className="group block px-5 py-4 transition-colors hover:bg-muted/60"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Clock className="size-3" />
                  <span>{article.time}</span>
                  {article.urgent && (
                    <span className="rounded bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">
                      Urgente
                    </span>
                  )}
                </div>
                <h3 className="mt-1.5 text-sm leading-snug font-semibold text-foreground transition-colors group-hover:text-secondary">
                  {article.title}
                </h3>
              </a>
            </li>
          ))}
        </ul>
        <a
          href="#"
          className="block border-t border-border px-5 py-3.5 text-center text-sm font-semibold text-secondary transition-colors hover:bg-muted/60"
        >
          Ver todas as notícias
        </a>
      </section>
    </aside>
  )
}
