"use client"

import { WHATSAPP_NUMBER } from "@/lib/portal-params"
import { useSiteIdentityStore } from "@/stores/useSiteIdentityStore"

const contactLinks = [
  {
    label: "anuncie conosco",
    message: "Olá! Gostaria de anunciar no Senador Canedo Hoje.",
  },
  {
    label: "entre em contato",
    message: "Olá! Gostaria de falar com a equipe do Senador Canedo Hoje.",
  },
]

function waLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

export function SiteFooter() {
  const siteName = useSiteIdentityStore((s) => s.name)
  const logoUrl = useSiteIdentityStore((s) => s.logoUrl)
  const logoAlt = useSiteIdentityStore((s) => s.logoAlt)

  return (
    <footer className="border-t border-black/10 bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={logoAlt}
              className="h-8 w-auto object-contain brightness-0 invert"
            />
          ) : (
            <p className="font-serif text-lg font-bold tracking-tight">
              {siteName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-6 text-sm">
          {contactLinks.map((link) => (
            <a
              key={link.label}
              href={waLink(link.message)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-foreground/80 transition-colors hover:text-primary-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
