import { Play } from "lucide-react"
import { FadeInImage } from "@/components/common/fade-in-image"
import { videos } from "@/lib/news-data"
import { assetPath } from "@/lib/utils"

export function VideosSection() {
  return (
    <section
      className="rounded-3xl bg-primary p-6 sm:p-8"
      aria-labelledby="videos-heading"
    >
      <div className="mb-6 flex items-center justify-between">
        <h2
          id="videos-heading"
          className="flex items-center gap-2.5 font-serif text-xl font-bold text-primary-foreground"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-destructive">
            <Play className="size-4 fill-current text-primary-foreground" />
          </span>
          Vídeos
        </h2>
        <a
          href="#"
          className="text-sm font-medium text-accent transition-colors hover:text-primary-foreground"
        >
          Ver mais vídeos
        </a>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {videos.map((video) => (
          <a key={video.id} href="#" className="group flex flex-col">
            <div className="relative aspect-video overflow-hidden rounded-2xl ring-1 ring-primary-foreground/10">
              <FadeInImage
                fill
                src={assetPath(video.thumbnail || "/placeholder.svg")}
                alt=""
                unoptimized
                sizes="(max-width: 768px) 100vw, 33vw"
                skeletonClassName="bg-primary-foreground/10"
                className="size-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:opacity-90"
              />
              <div className="absolute inset-0 bg-primary/20 transition-colors group-hover:bg-primary/10" />
              <span className="absolute top-1/2 left-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 shadow-lg transition-transform group-hover:scale-110">
                <Play className="size-6 translate-x-0.5 fill-primary text-primary" />
              </span>
              <span className="absolute right-3 bottom-3 rounded-md bg-primary/80 px-2 py-1 text-xs font-semibold text-primary-foreground">
                {video.duration}
              </span>
            </div>
            <span className="mt-3 text-xs font-semibold tracking-wide text-accent uppercase">
              {video.category}
            </span>
            <h3 className="mt-1 font-serif text-base leading-snug font-bold text-balance text-primary-foreground transition-colors group-hover:text-accent">
              {video.title}
            </h3>
          </a>
        ))}
      </div>
    </section>
  )
}
