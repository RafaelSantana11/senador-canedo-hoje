type JsonLdProps = {
  data: Record<string, unknown>
}

/**
 * Structured data (schema.org) como `<script>`. O `<` vira `\u003c` porque
 * `JSON.stringify` sozinho permitiria fechar o script via `</script>` em campos
 * vindos da API — recomendação da própria doc de JSON-LD do Next.
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  )
}
