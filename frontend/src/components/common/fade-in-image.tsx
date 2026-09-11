"use client"

import { useEffect, useRef, useState } from "react"
import Image, { type ImageProps } from "next/image"
import { ImageOff } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type ImageStatus = "loading" | "loaded" | "error"

type FadeInImageProps = ImageProps & {
  skeletonClassName?: string
}

export function FadeInImage({
  src,
  alt,
  className,
  skeletonClassName,
  onLoad,
  onError,
  ...props
}: FadeInImageProps) {
  const ref = useRef<HTMLImageElement>(null)
  const [status, setStatus] = useState<ImageStatus>("loading")

  useEffect(() => {
    const img = ref.current
    if (!img) return

    if (img.complete) {
      setStatus(img.naturalWidth > 0 ? "loaded" : "error")
    } else {
      setStatus("loading")
    }
  }, [src])

  return (
    <>
      {status === "loading" && (
        <Skeleton
          className={cn(
            "absolute inset-0 size-full rounded-none",
            skeletonClassName
          )}
        />
      )}
      {status === "error" && (
        <span className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
          <ImageOff className="size-6" aria-hidden />
        </span>
      )}
      <Image
        {...props}
        ref={ref}
        src={src}
        alt={alt}
        onLoad={(event) => {
          setStatus("loaded")
          onLoad?.(event)
        }}
        onError={(event) => {
          setStatus("error")
          onError?.(event)
        }}
        className={cn(
          "transition-opacity duration-700 ease-out",
          status === "loaded" ? "opacity-100" : "opacity-0",
          className
        )}
      />
    </>
  )
}
