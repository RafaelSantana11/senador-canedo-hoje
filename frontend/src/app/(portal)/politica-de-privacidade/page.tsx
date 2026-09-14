import type { Metadata } from "next"
import Link from "next/link"
import { WHATSAPP_NUMBER } from "@/lib/portal-params"

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como o Senador Canedo Hoje trata seus dados de navegação, em conformidade com a LGPD.",
}

const WHATSAPP_PRIVACY_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Olá! Tenho uma dúvida sobre a Política de Privacidade do Senador Canedo Hoje."
)}`

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="font-serif text-lg font-bold text-foreground">{title}</h2>
      <div className="mt-2 space-y-2 text-muted-foreground">{children}</div>
    </section>
  )
}

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link
        href="/"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        ← Voltar para a home
      </Link>

      <h1 className="mt-6 font-serif text-3xl font-bold tracking-tight text-foreground">
        Política de Privacidade
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Última atualização: setembro de 2026
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed">
        <Section title="1. Quais dados coletamos">
          <p>
            Com o seu consentimento, usamos o Google Analytics 4 (GA4) para
            medir audiência e entender como o site é usado. Isso inclui, de
            forma agregada e sem identificação pessoal: páginas visitadas,
            origem do tráfego, dispositivo e navegador, localização aproximada
            (cidade/região) e interações como rolagem de página,
            compartilhamento de matérias e cliques em banners.
          </p>
          <p>
            Não coletamos nome, e-mail, CPF ou qualquer outro dado que
            identifique você para fins de análise.
          </p>
        </Section>

        <Section title="2. Cookies que usamos">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-foreground">ga_consent</strong> (próprio,
              365 dias): registra a sua escolha para não perguntarmos de novo. É
              necessário para respeitar a sua decisão e não identifica você.
            </li>
            <li>
              <strong className="text-foreground">_ga e _ga_*</strong> (Google,
              até 2 anos): distinguem visitantes e sessões de navegação. Só são
              gravados depois que você clica em “Aceitar”.
            </li>
          </ul>
          <p>
            Se você recusar (ou continuar navegando sem responder), nenhum
            cookie de análise é gravado. Nesse caso, o GA4 envia apenas sinais
            anônimos, sem cookies e sem identificação, usados exclusivamente
            para estimativas agregadas de audiência.
          </p>
        </Section>

        <Section title="3. O que não fazemos">
          <ul className="list-disc space-y-1 pl-5">
            <li>Não usamos cookies de publicidade nem remarketing.</li>
            <li>Não criamos perfis para anúncios personalizados.</li>
            <li>Não vendemos nem cedemos seus dados para terceiros.</li>
            <li>
              Os banners de publicidade exibidos no site não fazem rastreamento
              comportamental.
            </li>
          </ul>
        </Section>

        <Section title="4. Compartilhamento">
          <p>
            Os dados de medição são processados pelo Google, que atua como
            operador e pode tratar informações em servidores fora do Brasil,
            com as salvaguardas contratuais previstas na LGPD. O tratamento
            realizado pelo Google é descrito na{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:text-primary"
            >
              Política de Privacidade do Google
            </a>
            .
          </p>
        </Section>

        <Section title="5. Base legal e finalidade">
          <p>
            Tratamos esses dados exclusivamente para medição de audiência, com
            base no seu consentimento (art. 7º, I, da LGPD). Você pode recusar
            ou revogar a escolha a qualquer momento, sem qualquer prejuízo ao
            uso do site.
          </p>
        </Section>

        <Section title="6. Por quanto tempo guardamos">
          <p>
            A sua escolha sobre cookies fica registrada por 365 dias. No GA4,
            os dados de eventos seguem a retenção configurada na propriedade
            (padrão de 14 meses) e são consultados apenas de forma agregada.
          </p>
        </Section>

        <Section title="7. Seus direitos">
          <p>
            Nos termos do art. 18 da LGPD, você pode confirmar a existência de
            tratamento, acessar, corrigir, anonimizar, portar ou eliminar seus
            dados, além de revogar o consentimento. Para revogar ou alterar a
            sua escolha, use o botão “gerenciar cookies” no rodapé do site.
          </p>
          <p>
            Para exercer os demais direitos, fale com a nossa equipe pelo{" "}
            <a
              href={WHATSAPP_PRIVACY_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:text-primary"
            >
              WhatsApp
            </a>
            .
          </p>
        </Section>

        <Section title="8. Alterações nesta política">
          <p>
            Podemos atualizar este texto para refletir mudanças no site ou na
            legislação. A data da última atualização aparece no topo desta
            página.
          </p>
        </Section>
      </div>
    </main>
  )
}
