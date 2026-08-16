"use client"

import Link from "next/link"
import { ArrowRight, FolderTree, Hash, Image as ImageIcon, Settings, Users } from "lucide-react"
import { PageHeader } from "@/components/admin/admin-shell"
import { useAdminStore } from "@/components/admin/admin-store"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function SettingsOverviewPage() {
  const { ready, categories, authors, tags, media } = useAdminStore()

  if (!ready) return null

  const submenus = [
    {
      title: "Categorias",
      description: "Gerencie as seções editoriais, cores e status das categorias de notícias.",
      icon: FolderTree,
      count: `${categories.length} categorias`,
      activeCount: `${categories.filter((c) => c.active).length} ativas`,
      href: "/admin/configuracoes/categorias",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      title: "Autores & Colunistas",
      description: "Cadastre repórteres, colunistas, cargos, fotos de perfil e redes sociais.",
      icon: Users,
      count: `${authors.length} autores`,
      activeCount: `${authors.filter((a) => a.active).length} ativos`,
      href: "/admin/configuracoes/autores",
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Tags & Palavras-Chave",
      description: "Crie etiquetas para marcar temas de matérias e facilitar pesquisas.",
      icon: Hash,
      count: `${tags.length} tags`,
      activeCount: `Usadas em matérias`,
      href: "/admin/configuracoes/tags",
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    },
    {
      title: "Biblioteca de Mídias",
      description: "Acervo centralizado de fotos, vídeos e documentos anexados no portal.",
      icon: ImageIcon,
      count: `${media.length} mídias`,
      activeCount: `${media.filter((m) => m.type === "image").length} imagens`,
      href: "/admin/configuracoes/midias",
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
  ]

  return (
    <div className="p-6 lg:p-10 space-y-6">
      <PageHeader
        title="Configurações do Portal"
        description="Gerencie os parâmetros essenciais, categorias, equipe editorial, tags e mídias."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {submenus.map((menu) => (
          <Card key={menu.href} className="border-border bg-card shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${menu.color}`}>
                  <menu.icon className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-foreground block">{menu.count}</span>
                  <span className="text-xs text-muted-foreground">{menu.activeCount}</span>
                </div>
              </div>
              <CardTitle className="font-serif font-bold text-xl text-foreground mt-4">
                {menu.title}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 pt-0">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {menu.description}
              </p>
            </CardContent>

            <CardFooter className="p-6 pt-0 border-t border-border/50 mt-4 flex items-center justify-end">
              <Link
                href={menu.href}
                className={cn(buttonVariants({ variant: "ghost" }), "gap-2 group")}
              >
                Acessar CRUD
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

