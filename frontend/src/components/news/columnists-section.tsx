import { Quote } from 'lucide-react'
import { columnists } from '@/lib/news-data'
import { assetPath } from '@/lib/utils'

export function ColumnistsSection() {
  return (
    <section aria-labelledby="colunistas-heading">
      <div className="mb-5 flex items-center justify-between">
        <h2
          id="colunistas-heading"
          className="flex items-center gap-2.5 font-serif text-xl font-bold text-primary"
        >
          <span className="inline-block h-6 w-1.5 rounded-full bg-secondary" aria-hidden />
          Colunistas
        </h2>
        <a
          href="#"
          className="text-sm font-medium text-secondary transition-colors hover:text-primary"
        >
          Todos os colunistas
        </a>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {columnists.map((c) => (
          <a
            key={c.id}
            href="#"
            className="group flex flex-col rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <img
                src={assetPath(c.avatar || '/placeholder.svg')}
                alt={`Foto de ${c.name}`}
                className="size-14 rounded-full object-cover ring-2 ring-accent/40"
              />
              <div>
                <h3 className="font-serif text-base font-bold text-foreground">
                  {c.name}
                </h3>
                <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
                  {c.role}
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2.5">
              <Quote className="size-5 shrink-0 text-accent" aria-hidden />
              <p className="text-sm leading-relaxed text-muted-foreground transition-colors group-hover:text-foreground">
                {c.headline}
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
