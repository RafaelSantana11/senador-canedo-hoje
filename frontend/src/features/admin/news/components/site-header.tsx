"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, Search, X } from "lucide-react"
import { categories } from "@/lib/news-data"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      {/* Top utility bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs">
          <span className="font-medium">
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          <div className="hidden items-center gap-4 sm:flex">
            <a href="#" className="transition-opacity hover:opacity-80">
              Assine
            </a>
            <span className="h-3 w-px bg-primary-foreground/30" aria-hidden />
            <Link href="/login" className="transition-opacity hover:opacity-80">
              Entrar
            </Link>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex size-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted lg:hidden"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>

          <a
            href="#"
            className="flex items-center gap-2.5"
            aria-label="Senador Canedo Hoje - Página inicial"
          >
            <span className="font-serif text-2xl font-bold tracking-tight text-primary">
              Senador Canedo Hoje
            </span>
          </a>
        </div>

        {/* Search */}
        <div className="hidden max-w-md flex-1 items-center md:flex">
          <label className="relative w-full">
            <span className="sr-only">Buscar notícias</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Buscar notícias, temas, colunistas..."
              className="w-full rounded-full border border-border bg-muted/60 py-2.5 pr-4 pl-10 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus:border-secondary focus:bg-card focus:ring-2 focus:ring-secondary/20"
            />
          </label>
        </div>

        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted md:hidden"
          aria-label="Buscar"
        >
          <Search className="size-5" />
        </button>
      </div>

      {/* Category nav */}
      <nav
        className="hidden border-t border-border lg:block"
        aria-label="Categorias"
      >
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4">
          {categories.map((cat, i) => (
            <a
              key={cat}
              href="#"
              className={cn(
                "relative border-b-2 border-transparent px-3 py-3 text-sm font-medium text-foreground transition-colors hover:text-secondary",
                i === 0 && "border-secondary text-secondary"
              )}
            >
              {cat}
            </a>
          ))}
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <nav
          className="border-t border-border bg-card px-4 py-2 lg:hidden"
          aria-label="Categorias"
        >
          <div className="grid grid-cols-2 gap-1 py-2">
            {categories.map((cat) => (
              <a
                key={cat}
                href="#"
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-secondary"
              >
                {cat}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}
