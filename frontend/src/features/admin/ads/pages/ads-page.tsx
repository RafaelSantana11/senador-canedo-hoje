"use client"

import { useState } from "react"
import Image from "next/image"
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/admin-shell"
import { useBanners } from "../hooks/use-banners"
import { useCreateBanner } from "../hooks/use-create-banner"
import { useUpdateBanner } from "../hooks/use-update-banner"
import { useDeleteBanner } from "../hooks/use-delete-banner"
import { BannerDialog } from "../components/banner-dialog"
import type { Banner, BannerPayload } from "../types/banner"
import { POSITION_LABELS } from "../types/banner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function AdsPage() {
  const { data, isLoading } = useBanners()
  const createBanner = useCreateBanner()
  const updateBanner = useUpdateBanner()
  const deleteBanner = useDeleteBanner()

  const banners = data?.data ?? []

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Banner | null>(null)
  const [toDelete, setToDelete] = useState<Banner | null>(null)

  if (isLoading) return null

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(banner: Banner) {
    setEditing(banner)
    setFormOpen(true)
  }

  function handleSubmit(payload: BannerPayload) {
    if (editing) {
      updateBanner.mutate(
        { id: editing.id, payload },
        {
          onSuccess: () => {
            toast.success("Campanha atualizada.")
            setFormOpen(false)
          },
          onError: () => {
            toast.error("Não foi possível atualizar a campanha.")
          },
        },
      )
    } else {
      createBanner.mutate(payload, {
        onSuccess: () => {
          toast.success("Campanha criada.")
          setFormOpen(false)
        },
        onError: () => {
          toast.error("Não foi possível criar a campanha.")
        },
      })
    }
  }

  function toggleActive(banner: Banner) {
    updateBanner.mutate(
      { id: banner.id, payload: { active: !banner.active } },
      {
        onError: () => {
          toast.error("Não foi possível alterar o status da campanha.")
        },
      },
    )
  }

  function confirmDelete() {
    if (toDelete) {
      deleteBanner.mutate(toDelete.id, {
        onSuccess: () => {
          toast.success("Campanha excluída.")
          setToDelete(null)
        },
        onError: () => {
          toast.error("Não foi possível excluir a campanha.")
        },
      })
    }
  }

  return (
    <div className="p-6 lg:p-10">
      <PageHeader
        title="Publicidades"
        description="Gerencie as campanhas e os espaços publicitários do portal."
        action={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova publicidade
          </Button>
        }
      />

      {banners.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma campanha cadastrada. Crie a primeira publicidade.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {banners.map((banner) => {
            const item = banner.items[0]
            return (
              <Card key={banner.id} className="overflow-hidden border-border p-0 shadow-sm">
                <div className="relative aspect-[16/9] bg-muted">
                  {item?.file.path ? (
                    <Image
                      src={item.file.path}
                      alt={item.file.alt ?? banner.title}
                      fill
                      className="object-cover"
                      sizes="400px"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      Sem criativo
                    </div>
                  )}
                  <div className="absolute left-3 top-3">
                    <Badge
                      className={
                        banner.active
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-muted-foreground/80 text-background"
                      }
                    >
                      {banner.active ? "Ativa" : "Pausada"}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-secondary">
                    {POSITION_LABELS[banner.position]}
                  </p>
                  <h3 className="mt-1 font-serif text-lg font-bold leading-tight text-foreground">
                    {banner.title}
                  </h3>
                  {banner.advertiser && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{banner.advertiser}</p>
                  )}
                  {item?.linkUrl && (
                    <a
                      href={item.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-secondary"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span className="max-w-[200px] truncate">{item.linkUrl}</span>
                    </a>
                  )}
                </CardContent>
                <CardFooter className="flex items-center justify-between border-t border-border p-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                    <Checkbox
                      checked={banner.active}
                      onCheckedChange={() => toggleActive(banner)}
                      className="data-checked:border-secondary data-checked:bg-secondary"
                    />
                    {banner.active ? "Ativa" : "Ativar"}
                  </label>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(banner)} aria-label="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setToDelete(banner)}
                      aria-label="Excluir"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      <BannerDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir publicidade?</AlertDialogTitle>
            <AlertDialogDescription>
              A campanha &quot;{toDelete?.title}&quot; será removida permanentemente. As imagens do
              acervo não são apagadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
