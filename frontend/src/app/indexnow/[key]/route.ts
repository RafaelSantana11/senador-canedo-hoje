// Arquivo de verificação do IndexNow: `GET /indexnow/<INDEXNOW_KEY>.txt`
// devolve a própria chave. O ping passa esse caminho como `keyLocation`.
export const dynamic = "force-dynamic"

interface KeyFileProps {
  params: Promise<{ key: string }>
}

export async function GET(_request: Request, { params }: KeyFileProps) {
  const { key } = await params
  const configured = process.env.INDEXNOW_KEY?.trim()

  if (!configured || key !== `${configured}.txt`) {
    return new Response("Not Found", { status: 404 })
  }

  return new Response(configured, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  })
}
