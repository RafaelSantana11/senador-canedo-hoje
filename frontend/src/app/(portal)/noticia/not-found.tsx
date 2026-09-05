import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Notícia não encontrada",
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold">Notícia não encontrada</h1>
        <p className="mt-2 text-muted-foreground">
          Esta matéria pode ter sido removida ou o link está incorreto.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Voltar à home
        </Link>
      </div>
    </div>
  )
}
