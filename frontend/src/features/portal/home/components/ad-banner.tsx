"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { useServeBanners } from "../hooks/use-serve-banners"
import type { BannerPosition, PublicBannerItem } from "../types/banner"

const POSITION_BY_SIZE: Record<
  "leaderboard" | "box" | "middle",
  BannerPosition
> = {
  leaderboard: "top",
  box: "aside",
  middle: "middle",
}

export function AdBanner({
  size = "leaderboard",
  className,
}: {
  size?: "leaderboard" | "box" | "middle"
  className?: string
}) {
  const position = POSITION_BY_SIZE[size]
  const { data, isLoading } = useServeBanners()

  if (isLoading) {
    return (
      <Skeleton
        className={cn(
          "rounded-xl",
          size === "box"
            ? "aspect-square w-full"
            : size === "middle"
              ? "h-40 w-full sm:h-44"
              : "h-24 w-full sm:h-28",
          className
        )}
      />
    )
  }

  // Posição vazia não é erro: volta ao espaço reservado.
  const items = data?.[position] ?? []

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl",
        size === "box"
          ? "aspect-square w-full"
          : size === "middle"
            ? "h-40 w-full sm:h-44"
            : "h-24 w-full sm:h-28",
        className,
      )}
      role="complementary"
      aria-label="Espaço publicitário"
    >
      {items.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-gray-400 bg-muted/50 text-primary">
          <span className="text-[10px] font-semibold uppercase tracking-widest">
            Publicidade
          </span>
          <span className="mt-1 text-xs">Anuncie aqui</span>
        </div>
      ) : (
        <BannerCarousel items={items} />
      )}
    </div>
  )
}

function BannerCarousel({ items }: { items: PublicBannerItem[] }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (items.length < 2) return
    const timer = setTimeout(
      () => setIndex((v) => (v + 1) % items.length),
      Math.min(Math.max(items[index]?.durationMs ?? 5000, 500), 300000),
    )
    return () => clearTimeout(timer)
  }, [index, items])

  const item = items[index] ?? items[0]

  const img = (
    <Image
      fill
      src={item.image.path}
      alt={item.alt ?? item.image.alt ?? ""}
      unoptimized
      loading="eager"
      sizes="(max-width: 640px) 100vw, 33vw"
      className="h-full w-full object-cover"
    />
  )

  return item.linkUrl ? (
    <a href={item.linkUrl} target="_blank" rel="noreferrer sponsored" className="relative block h-full w-full">
      {img}
    </a>
  ) : (
    img
  )
}
