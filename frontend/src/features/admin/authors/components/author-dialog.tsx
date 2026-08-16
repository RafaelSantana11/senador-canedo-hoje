"use client"

import { useEffect, useState } from "react"
import type { Author } from "@/components/admin/admin-store"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export type AuthorFormValues = {
  name: string
  email: string
  role: string
  bio: string
  avatar: string
  twitter?: string
  instagram?: string
  linkedin?: string
  active: boolean
}

export function AuthorDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: Author | null
  onSubmit: (values: AuthorFormValues) => void
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("")
  const [bio, setBio] = useState("")
  const [avatar, setAvatar] = useState("")
  const [twitter, setTwitter] = useState("")
  const [instagram, setInstagram] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [active, setActive] = useState(true)

  useEffect(() => {
    if (initial) {
      setName(initial.name)
      setEmail(initial.email)
      setRole(initial.role)
      setBio(initial.bio)
      setAvatar(initial.avatar || "")
      setTwitter(initial.twitter || "")
      setInstagram(initial.instagram || "")
      setLinkedin(initial.linkedin || "")
      setActive(initial.active)
    } else {
      setName("")
      setEmail("")
      setRole("")
      setBio("")
      setAvatar("/news/columnist-1.png")
      setTwitter("")
      setInstagram("")
      setLinkedin("")
      setActive(true)
    }
  }, [initial, open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return

    onSubmit({
      name: name.trim(),
      email: email.trim(),
      role: role.trim() || "Jornalista / Colunista",
      bio: bio.trim(),
      avatar: avatar.trim() || "/news/columnist-1.png",
      twitter: twitter.trim() || undefined,
      instagram: instagram.trim() || undefined,
      linkedin: linkedin.trim() || undefined,
      active,
    })
    onOpenChange(false)
  }

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar Autor" : "Novo Autor"}</DialogTitle>
          <DialogDescription>
            Cadastre ou edite as informações do jornalista, colunista ou colaborador.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Avatar Preview */}
          <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-xl border border-border">
            <Avatar className="h-14 w-14 border border-border">
              <AvatarImage src={avatar} alt={name || "Avatar"} />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                {initials || "AU"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <Label htmlFor="author-avatar" className="text-xs font-semibold">
                URL da Foto / Avatar
              </Label>
              <Input
                id="author-avatar"
                placeholder="/news/columnist-1.png ou https://..."
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="author-name">Nome Completo</Label>
              <Input
                id="author-name"
                placeholder="Ex: Mariana Costa"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="author-email">E-mail</Label>
              <Input
                id="author-email"
                type="email"
                placeholder="mariana@portal.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="author-role">Cargo / Editoria</Label>
            <Input
              id="author-role"
              placeholder="Ex: Colunista de Política & Poder, Editor de Economia"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="author-bio">Biografia / Apresentação</Label>
            <Textarea
              id="author-bio"
              rows={3}
              placeholder="Breve resumo da trajetória profissional do autor..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          {/* Social Links */}
          <div className="space-y-2 pt-2 border-t border-border">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
              Redes Sociais (Opcional)
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <Label htmlFor="author-twitter" className="text-xs text-muted-foreground">
                  Twitter / X
                </Label>
                <Input
                  id="author-twitter"
                  placeholder="@usuario"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <Label htmlFor="author-instagram" className="text-xs text-muted-foreground">
                  Instagram
                </Label>
                <Input
                  id="author-instagram"
                  placeholder="@usuario"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <Label htmlFor="author-linkedin" className="text-xs text-muted-foreground">
                  LinkedIn
                </Label>
                <Input
                  id="author-linkedin"
                  placeholder="perfil-linkedin"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="author-active" className="text-sm font-medium">
                Autor Ativo
              </Label>
              <p className="text-xs text-muted-foreground">
                Autores ativos podem ter novos artigos vinculados e aparecem no portal.
              </p>
            </div>
            <Switch
              id="author-active"
              checked={active}
              onCheckedChange={setActive}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{initial ? "Salvar Alterações" : "Cadastrar Autor"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
