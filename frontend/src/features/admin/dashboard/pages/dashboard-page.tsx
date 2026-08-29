"use client"

import Link from "next/link"
import {
  ArrowUpRight,
  FileText,
  Megaphone,
  Radio,
  TrendingUp,
} from "lucide-react"
import { PageHeader } from "@/components/admin/admin-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { assetPath } from "@/lib/utils"
import { useNews } from "@/features/admin/news/hooks/use-news"
import { useBanners } from "@/features/admin/ads/hooks/use-banners"

export default function AdminDashboardPage() {
  const { data: newsResponse, isLoading: loadingNews } = useNews({ limit: 50 })
  const { data: bannersResponse, isLoading: loadingBanners } = useBanners({ limit: 50 })

  if (loadingNews || loadingBanners) return null

  const articles = newsResponse?.data ?? []
  const banners = bannersResponse?.data ?? []

  const published = articles.filter((a) => a.status === "published").length
  const drafts = articles.filter((a) => a.status === "draft").length
  const activeBanners = banners.filter((b) => b.active).length

  const stats = [
    {
      label: "Notícias publicadas",
      value: published,
      icon: FileText,
      hint: `${drafts} em rascunho`,
    },
    {
      label: "Total de matérias",
      value: articles.length,
      icon: TrendingUp,
      hint: "no acervo",
    },
    {
      label: "Anúncios ativos",
      value: activeBanners,
      icon: Radio,
      hint: `de ${banners.length} campanhas`,
    },
    {
      label: "Campanhas",
      value: banners.length,
      icon: Megaphone,
      hint: "cadastradas",
    },
  ]

  const recent = articles.slice(0, 5)

  return (
    <div className="p-6 lg:p-10">
      <PageHeader
        title="Painel"
        description="Visão geral do conteúdo e das campanhas do portal."
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border shadow-sm">
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="mt-2 font-serif text-3xl font-bold text-foreground">
                  {s.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/40 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-border shadow-sm lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Matérias recentes</CardTitle>
            <Link
              href="/admin/noticias"
              className="inline-flex items-center gap-1 text-sm font-medium text-secondary hover:underline"
            >
              Gerenciar <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {recent.map((a) => (
              <div key={a.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                  <img
                    src={assetPath(a.cover?.path || "/placeholder.svg")}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.category.name}</p>
                </div>
                <Badge
                  variant={a.status === "published" ? "default" : "secondary"}
                  className={a.status === "published" ? "bg-secondary text-secondary-foreground" : ""}
                >
                  {a.status === "published" ? "Publicado" : a.status === "archived" ? "Arquivada" : "Rascunho"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Campanhas ativas</CardTitle>
            <Link
              href="/admin/publicidades"
              className="inline-flex items-center gap-1 text-sm font-medium text-secondary hover:underline"
            >
              Gerenciar <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {banners.filter((b) => b.active).length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma campanha ativa.</p>
            )}
            {banners
              .filter((b) => b.active)
              .map((b) => (
                <div key={b.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                    <img
                      src={assetPath(b.items[0]?.file.path || "/placeholder.svg")}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{b.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{b.advertiser}</p>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
