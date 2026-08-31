"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { Menu, Search, X } from "lucide-react"
import { usePortalCategories } from "../hooks/use-categories"
import { useSelectedCategory } from "../contexts/category-context"
import { useSearch } from "../contexts/search-context"
import { cn } from "@/lib/utils"
import { useSiteIdentityStore } from "@/stores/useSiteIdentityStore"

const ALL_NEWS_ITEM = { id: "__all__", name: "Notícias", slug: null }

type SearchFormData = {
  search: string
}

export function SiteHeader() {
  const siteName = useSiteIdentityStore((s) => s.name)
  const logoUrl = useSiteIdentityStore((s) => s.logoUrl)
  const logoAlt = useSiteIdentityStore((s) => s.logoAlt)
  const showNameWithLogo = useSiteIdentityStore((s) => s.showNameWithLogo)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const { data } = usePortalCategories()
  const categories = data?.data ?? []
  const { selectedSlug, setSelectedSlug } = useSelectedCategory()
  const { searchQuery, setSearchQuery } = useSearch()

  const navItems = [{ ...ALL_NEWS_ITEM, slug: null }, ...categories]

  const { register, handleSubmit, watch, setValue } = useForm<SearchFormData>({
    defaultValues: {
      search: searchQuery,
    },
  })

  // Sincroniza o valor do form caso o searchQuery mude externamente (ex: botão de limpar busca)
  useEffect(() => {
    setValue("search", searchQuery)
  }, [searchQuery, setValue])

  const searchFieldValue = watch("search") ?? ""

  const handleSearchSubmit = (data: SearchFormData) => {
    setSearchQuery(data.search.trim())
  }

  const handleClear = () => {
    setValue("search", "")
    setSearchQuery("")
  }

  const { ref: desktopRef, ...desktopRegister } = register("search", {
    onChange: (e) => {
      setSearchQuery(e.target.value)
    },
  })

  const { ref: mobileRef, ...mobileRegister } = register("search", {
    onChange: (e) => {
      setSearchQuery(e.target.value)
    },
  })

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
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

          <Link
            href="/"
            className="flex items-center gap-2.5"
            aria-label={`${siteName} - Página inicial`}
          >
            {logoUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt={logoAlt}
                  className="h-8 w-auto object-contain"
                />
                {showNameWithLogo && (
                  <span className="hidden font-serif text-2xl font-bold tracking-tight text-primary sm:inline">
                    {siteName}
                  </span>
                )}
              </>
            ) : (
              <span className="font-serif text-2xl font-bold tracking-tight text-primary">
                {siteName}
              </span>
            )}
          </Link>
        </div>

        {/* Desktop Search */}
        <form
          onSubmit={handleSubmit(handleSearchSubmit)}
          className="hidden max-w-md flex-1 items-center md:flex"
        >
          <div className="relative w-full">
            <span className="sr-only">Buscar notícias</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              {...desktopRegister}
              ref={desktopRef}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  handleClear()
                }
              }}
              placeholder="Buscar notícias, temas, colunistas..."
              className="w-full rounded-full border border-border bg-muted/60 py-2.5 pr-9 pl-10 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus:border-secondary focus:bg-card focus:ring-2 focus:ring-secondary/20"
            />
            {searchFieldValue && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Limpar busca"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </form>

        {/* Mobile Search Toggle Button */}
        <button
          type="button"
          onClick={() => {
            setMobileSearchOpen((v) => !v)
            if (menuOpen) setMenuOpen(false)
          }}
          className={cn(
            "inline-flex size-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted md:hidden",
            mobileSearchOpen && "bg-muted text-secondary"
          )}
          aria-label={mobileSearchOpen ? "Fechar busca" : "Abrir busca"}
        >
          {mobileSearchOpen ? <X className="size-5" /> : <Search className="size-5" />}
        </button>
      </div>

      {/* Mobile Search Dropdown */}
      {mobileSearchOpen && (
        <div className="border-t border-border bg-card px-4 py-3 md:hidden">
          <form onSubmit={handleSubmit(handleSearchSubmit)} className="relative w-full">
            <span className="sr-only">Buscar notícias</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              autoFocus
              {...mobileRegister}
              ref={mobileRef}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  handleClear()
                  setMobileSearchOpen(false)
                }
              }}
              placeholder="Buscar notícias, temas, colunistas..."
              className="w-full rounded-full border border-border bg-muted/60 py-2.5 pr-9 pl-10 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus:border-secondary focus:bg-card focus:ring-2 focus:ring-secondary/20"
            />
            {searchFieldValue && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Limpar busca"
              >
                <X className="size-3.5" />
              </button>
            )}
          </form>
        </div>
      )}

      {/* Category nav */}
      <nav
        className="hidden border-t border-border lg:block"
        aria-label="Categorias"
      >
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4">
          {navItems.map((cat) => {
            const isActive = cat.slug === selectedSlug
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedSlug(cat.slug)}
                className={cn(
                  "relative border-b-2 border-transparent px-3 py-3 text-sm font-medium text-foreground transition-colors hover:text-secondary",
                  isActive && "border-secondary text-secondary"
                )}
              >
                {cat.name}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <nav
          className="border-t border-border bg-card px-4 py-2 lg:hidden"
          aria-label="Categorias"
        >
          <div className="grid grid-cols-2 gap-1 py-2">
            {navItems.map((cat) => {
              const isActive = cat.slug === selectedSlug
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedSlug(cat.slug)
                    setMenuOpen(false)
                  }}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-secondary",
                    isActive && "bg-muted text-secondary"
                  )}
                >
                  {cat.name}
                </button>
              )
            })}
          </div>
        </nav>
      )}
    </header>
  )
}
