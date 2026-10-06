"use client"

import Link from "next/link"
import { openConsentPreferences } from "@/lib/consent"
import { usePortalSettings } from "@/features/portal/settings/hooks/use-portal-settings"

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

const LINK_CLASS =
  "text-primary-foreground/80 transition-colors hover:text-primary-foreground"

export function SiteFooter() {
  const {
    SITE_NAME: siteName,
    LOGO,
    LOGO_ALT: logoAlt,
    WHATSAPP_NUMBER: whatsappNumber,
    CONTACT_EMAIL: contactEmail,
  } = usePortalSettings()
  const logoUrl = LOGO?.path ?? ""

  function waLink(message: string) {
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
  }

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
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          {contactLinks.map((link) => (
            <a
              key={link.label}
              href={waLink(link.message)}
              target="_blank"
              rel="noopener noreferrer"
              className={LINK_CLASS}
            >
              {link.label}
            </a>
          ))}
          {contactEmail && (
            <a href={`mailto:${contactEmail}`} className={LINK_CLASS}>
              {contactEmail}
            </a>
          )}
          <Link href="/politica-de-privacidade" className={LINK_CLASS}>
            política de privacidade
          </Link>
          <button
            type="button"
            onClick={openConsentPreferences}
            className={`cursor-pointer ${LINK_CLASS}`}
          >
            gerenciar cookies
          </button>
        </div>
      </div>
    </footer>
  )
}
