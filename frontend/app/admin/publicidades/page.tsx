"use client"

import { useState } from "react"
import Image from "next/image"
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/admin-shell"
import { useAdminStore, type Ad } from "@/components/admin/admin-store"
import { AdFormDialog, type AdFormValues } from "@/components/admin/ad-form-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

export default function AdminAdsPage() {
  const { ready, ads, addAd, updateAd, deleteAd, toggleAd } = useAdminStore()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Ad | null>(null)
  const [toDelete, setToDelete] = useState<Ad | null>(null)

  if (!ready) return null

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(ad: Ad) {
    setEditing(ad)
    setFormOpen(true)
  }

  function handleSubmit(values: AdFormValues) {
    if (editing) {
      updateAd(editing.id, values)
      toast.success("Campanha atualizada.")
    } else {
      addAd(values)
      toast.success("Campanha criada.")
    }
  }

  function confirmDelete() {
    if (toDelete) {
      deleteAd(toDelete.id)
      toast.success("Campanha excluída.")
      setToDelete(null)
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

      {ads.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma campanha cadastrada. Crie a primeira publicidade.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {ads.map((ad) => (
            <Card key={ad.id} className="overflow-hidden border-border p-0 shadow-sm">
              <div className="relative aspect-[16/9] bg-muted">
                <Image src={ad.image || "/placeholder.svg"} alt={ad.title} fill className="object-cover" sizes="400px" />
                <div className="absolute left-3 top-3">
                  <Badge
                    className={
                      ad.active
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-muted-foreground/80 text-background"
                    }
                  >
                    {ad.active ? "Ativa" : "Pausada"}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-secondary">
                  {ad.placement}
                </p>
                <h3 className="mt-1 font-serif text-lg font-bold leading-tight text-foreground">
                  {ad.title}
                </h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{ad.advertiser}</p>
                {ad.link && (
                  <a
                    href={ad.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-secondary"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span className="max-w-[200px] truncate">{ad.link}</span>
                  </a>
                )}
              </CardContent>
              <CardFooter className="flex items-center justify-between border-t border-border p-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={ad.active}
                    onChange={() => toggleAd(ad.id)}
                    className="h-4 w-4 rounded border-border accent-[var(--secondary)]"
                  />
                  {ad.active ? "Ativa" : "Ativar"}
                </label>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(ad)} aria-label="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setToDelete(ad)}
                    aria-label="Excluir"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AdFormDialog
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
              A campanha &quot;{toDelete?.title}&quot; será removida permanentemente.
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
