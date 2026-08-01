// Custom next/image loader, used only by the static-export build.
//
// A static export has no /_next/image endpoint to resize on the fly, and
// `unoptimized: true` would emit the src verbatim — dropping basePath and
// 404ing every /news/*.png on a subpath deploy (GitHub Pages project site).
// This loader keeps basePath applied for every <Image>, including ones added
// later, without touching call sites.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

export default function imageLoader({ src }: { src: string }): string {
  if (!BASE_PATH || !src.startsWith("/")) return src
  return `${BASE_PATH}${src}`
}
