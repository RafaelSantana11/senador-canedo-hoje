import { AtSign, Rss, Send, Share2 } from "lucide-react"

const footerSections = [
  {
    title: "Editorias",
    links: [
      "Política",
      "Economia",
      "Mundo",
      "Tecnologia",
      "Esportes",
      "Cultura",
    ],
  },
  {
    title: "Institucional",
    links: [
      "Quem somos",
      "Código de ética",
      "Trabalhe conosco",
      "Fale conosco",
      "Expediente",
    ],
  },
  {
    title: "Serviços",
    links: ["Assine", "Newsletter", "Podcasts", "Aplicativo", "RSS"],
  },
]

const socials = [
  { icon: Share2, label: "Redes sociais" },
  { icon: AtSign, label: "Contato por e-mail" },
  { icon: Send, label: "Canal no Telegram" },
  { icon: Rss, label: "Feed RSS" },
]

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-serif text-2xl font-bold tracking-tight">
                Senador Canedo Hoje
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-primary-foreground/70">
              Jornalismo independente e confiável, com cobertura completa dos
              principais acontecimentos do Brasil e do mundo, 24 horas por dia.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="flex size-9 items-center justify-center rounded-full bg-primary-foreground/10 transition-colors hover:bg-secondary"
                >
                  <s.icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-serif text-base font-bold">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {section.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-primary-foreground/70 transition-colors hover:text-accent"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-primary-foreground/15 pt-6 text-xs text-primary-foreground/60 sm:flex-row">
          <p>
            © {new Date().getFullYear()} SenadorCanedoHoje. Todos os direitos
            reservados.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="transition-colors hover:text-accent">
              Termos de uso
            </a>
            <a href="#" className="transition-colors hover:text-accent">
              Privacidade
            </a>
            <a href="#" className="transition-colors hover:text-accent">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
