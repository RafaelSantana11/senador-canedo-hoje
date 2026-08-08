"use client"

import Link from "next/link"
import Image from "next/image"
import {
  ArrowUpRight,
  FileText,
  Megaphone,
  Radio,
  TrendingUp,
} from "lucide-react"
import { PageHeader } from "@/components/admin/admin-shell"
import { useAdminStore } from "@/components/admin/admin-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function AdminDashboardPage() {
  const { ready, articles, ads } = useAdminStore()

  if (!ready) return null

  const published = articles.filter((a) => a.status === "Publicado").length
  const drafts = articles.filter((a) => a.status === "Rascunho").length
  const activeAds = ads.filter((a) => a.active).length

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
      value: activeAds,
      icon: Radio,
      hint: `de ${ads.length} campanhas`,
    },
    {
      label: "Campanhas",
      value: ads.length,
      icon: Megaphone,
      hint: "cadastradas",
    },
  ]

  const recent = [...articles].slice(0, 5)

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
                  <Image src={a.image || "/placeholder.svg"} alt="" fill className="object-cover" sizes="64px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.category}</p>
                </div>
                <Badge
                  variant={a.status === "Publicado" ? "default" : "secondary"}
                  className={a.status === "Publicado" ? "bg-secondary text-secondary-foreground" : ""}
                >
                  {a.status}
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
            {ads.filter((a) => a.active).length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma campanha ativa.</p>
            )}
            {ads
              .filter((a) => a.active)
              .map((ad) => (
                <div key={ad.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                    <Image src={ad.image || "/placeholder.svg"} alt="" fill className="object-cover" sizes="56px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{ad.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{ad.advertiser}</p>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
