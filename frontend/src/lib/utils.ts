import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

/**
 * Prefixes a root-relative asset path with the deploy basePath.
 *
 * `next/link` and `next/image` do this on their own, but plain `<img src>` does
 * not — without it every /news/*.png 404s when the site is served from a
 * subpath (GitHub Pages project site). No-op when BASE_PATH is empty.
 * External and data URLs pass through untouched.
 */
export function assetPath(src: string): string {
  if (!BASE_PATH || !src.startsWith("/")) return src
  return `${BASE_PATH}${src}`
}
