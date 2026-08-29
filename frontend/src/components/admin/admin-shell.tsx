"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FilePlus2,
  FolderTree,
  Hash,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Newspaper,
  Settings,
  Users,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import { useAuthStore } from "@/stores/useAuthStore"
import { getMe, logoutUser } from "@/features/admin/auth/services/auth-service"
import { AdminStoreProvider } from "@/components/admin/admin-store"

const mainNav = [
  { href: "/admin", label: "Painel", icon: LayoutDashboard },
  { href: "/admin/newNews", label: "Publicar", icon: FilePlus2 },
  { href: "/admin/noticias", label: "Notícias", icon: Newspaper },
  { href: "/admin/publicidades", label: "Publicidades", icon: Megaphone },
]

const settingsSubNav = [
  { href: "/admin/configuracoes", label: "Visão Geral", icon: Settings, exact: true },
  { href: "/admin/configuracoes/categorias", label: "Categorias", icon: FolderTree },
  { href: "/admin/configuracoes/autores", label: "Autores", icon: Users },
  { href: "/admin/configuracoes/tags", label: "Tags", icon: Hash },
  { href: "/admin/configuracoes/midias", label: "Mídias", icon: ImageIcon },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)
  const refreshToken = useAuthStore((state) => state.refreshToken)
  const [ready, setReady] = useState(false)
  const [authError, setAuthError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(true)

  function retrySession() {
    setAuthError(false)
    setReady(false)
    setAttempt((a) => a + 1)
  }

  useEffect(() => {
    if (!refreshToken) {
      router.replace("/login")
      return
    }
    // Fonte da verdade de quem está logado (traz o `author`). O interceptor do
    // axios renova o access token antes desta chamada; 401 aqui desloga sozinho.
    // O painel só desbloqueia depois que a sessão é confirmada, para nada ficar
    // clicável antes da autenticação.
    getMe()
      .then((me) => useAuthStore.getState().setUser(me))
      .then(() => {
        setReady(true)
        setAuthError(false)
      })
      .catch(() => {
        setAuthError(true)
        setReady(false)
      })
  }, [router, refreshToken, attempt])

  useEffect(() => {
    setMobileOpen(false)
    if (pathname.startsWith("/admin/configuracoes")) {
      setSettingsOpen(true)
    }
  }, [pathname])

  function handleLogout() {
    logoutUser().catch(() => {})
    useAuthStore.getState().logoutLocal()
    router.replace("/login")
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        {authError ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Não foi possível validar a sessão.
            </p>
            <Button variant="outline" onClick={retrySession}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        )}
      </div>
    )
  }

  const isSettingsActive = pathname.startsWith("/admin/configuracoes")

  const sidebar = (
    <div className="relative flex h-full flex-col bg-primary text-primary-foreground">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-[1.15rem] z-10 hidden h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground lg:flex"
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      <div
        className={cn(
          "flex items-center py-5",
          collapsed ? "justify-center" : "gap-3 px-6",
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/10 ring-1 ring-primary-foreground/20">
          <Newspaper className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <p className="font-serif text-lg font-bold">Portal Notícias</p>
            <p className="text-xs text-accent">Painel Editorial</p>
          </div>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4 overflow-y-auto">
        {mainNav.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                collapsed ? "justify-center px-2" : "gap-3 px-3",
                active
                  ? "bg-primary-foreground/15 text-primary-foreground"
                  : "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground",
              )}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {!collapsed && item.label}
            </Link>
          )
        })}

        {/* Configurações with Sub-menu */}
        <div className="mt-1">
          <button
            onClick={() => {
              if (collapsed) {
                setCollapsed(false)
                setSettingsOpen(true)
                return
              }
              setSettingsOpen((prev) => !prev)
            }}
            title={collapsed ? "Configurações" : undefined}
            className={cn(
              "flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              collapsed ? "justify-center px-2" : "justify-between px-3",
              isSettingsActive
                ? "bg-primary-foreground/15 text-primary-foreground"
                : "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground",
            )}
          >
            <div className={cn("flex items-center", collapsed ? "" : "gap-3")}>
              <Settings className="h-4.5 w-4.5 shrink-0" />
              {!collapsed && <span>Configurações</span>}
            </div>
            {!collapsed &&
              (settingsOpen ? (
                <ChevronDown className="h-4 w-4 opacity-70" />
              ) : (
                <ChevronRight className="h-4 w-4 opacity-70" />
              ))}
          </button>

          {!collapsed && settingsOpen && (
            <div className="mt-1 flex flex-col gap-1 pl-4 border-l border-primary-foreground/15 ml-3">
              {settingsSubNav.map((sub) => {
                const active = sub.exact
                  ? pathname === sub.href
                  : pathname === sub.href || pathname.startsWith(`${sub.href}/`)
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                      active
                        ? "bg-secondary text-secondary-foreground font-semibold shadow-xs"
                        : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground",
                    )}
                  >
                    <sub.icon className="h-3.5 w-3.5" />
                    {sub.label}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </nav>

      <div className="px-3 pb-3">
        <Link
          href="/"
          target="_blank"
          title={collapsed ? "Ver o site" : undefined}
          className={cn(
            "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground",
            collapsed ? "justify-center px-2" : "gap-3 px-3",
          )}
        >
          <ExternalLink className="h-4.5 w-4.5 shrink-0" />
          {!collapsed && "Ver o site"}
        </Link>
      </div>

      <div className={cn("border-t border-primary-foreground/15", collapsed ? "py-3" : "p-4")}>
        <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "")}>
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
              {user?.name?.slice(0, 2).toUpperCase() ?? "SC"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-primary-foreground/60">{user?.email}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="rounded-md p-2 text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
              aria-label="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <AdminStoreProvider>
      <div
        className={cn(
          "min-h-screen bg-background lg:grid lg:transition-[grid-template-columns] lg:duration-300",
          collapsed ? "lg:grid-cols-[5rem_1fr]" : "lg:grid-cols-[16rem_1fr]",
        )}
      >
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
