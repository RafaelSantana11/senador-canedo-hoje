"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ExternalLink,
  FilePlus2,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Newspaper,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import { getUser, isAuthenticated, logout, type AdminUser } from "@/lib/admin-auth"
import { AdminStoreProvider } from "@/components/admin/admin-store"

const nav = [
  { href: "/admin", label: "Painel", icon: LayoutDashboard },
  { href: "/admin/newNews", label: "Publicar", icon: FilePlus2 },
  { href: "/admin/noticias", label: "Notícias", icon: Newspaper },
  { href: "/admin/publicidades", label: "Publicidades", icon: Megaphone },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)
  const [user, setUser] = useState<AdminUser | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login")
      return
    }
    setUser(getUser())
    setChecked(true)
  }, [router])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  function handleLogout() {
    logout()
    router.replace("/login")
  }

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-primary text-primary-foreground">
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 ring-1 ring-primary-foreground/20">
          <Newspaper className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <p className="font-serif text-lg font-bold">Portal Notícias</p>
          <p className="text-xs text-accent">Painel Editorial</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {nav.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary-foreground/15 text-primary-foreground"
                  : "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground",
              )}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 pb-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
        >
          <ExternalLink className="h-4.5 w-4.5" />
          Ver o site
        </Link>
      </div>

      <div className="border-t border-primary-foreground/15 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
              EC
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-primary-foreground/60">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-md p-2 text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
            aria-label="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <AdminStoreProvider>
      <div className="min-h-screen bg-background lg:grid lg:grid-cols-[16rem_1fr]">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen lg:block">{sidebar}</aside>

        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-border bg-primary px-4 py-3 text-primary-foreground lg:hidden">
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            <span className="font-serif text-base font-bold">Painel Editorial</span>
          </div>
          <button onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
            <Menu className="h-6 w-6" />
          </button>
        </header>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-foreground/50"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-72">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-4 z-10 rounded-md p-1 text-primary-foreground/80"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
              {sidebar}
            </div>
          </div>
        )}

        <div className="min-w-0">{children}</div>
      </div>
    </AdminStoreProvider>
  )
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
