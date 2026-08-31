"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail, Newspaper } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { assetPath } from "@/lib/utils"
import { useSiteIdentityStore } from "@/stores/useSiteIdentityStore"
import { useAuthStore } from "@/stores/useAuthStore"
import { useLogin } from "../hooks/use-login"
import type { LoginPayload } from "../types/auth"

type LoginErrorData = {
  errors?: Record<string, string>
  message?: string | string[]
}

type LoginError = {
  response?: { data?: LoginErrorData }
}

const FIELD_MESSAGES: Record<string, string> = {
  notFound: "E-mail não cadastrado.",
  incorrectPassword: "Senha incorreta.",
}

export default function LoginPage() {
  const router = useRouter()
  const siteName = useSiteIdentityStore((s) => s.name)
  const logoUrl = useSiteIdentityStore((s) => s.logoUrl)
  const logoAlt = useSiteIdentityStore((s) => s.logoAlt)
  const { mutate, isPending, error } = useLogin()
  const token = useAuthStore((state) => state.token)
  const refreshToken = useAuthStore((state) => state.refreshToken)
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginPayload>({
    defaultValues: { email: "", password: "" },
  })

  useEffect(() => {
    if (token || refreshToken) router.replace("/admin")
  }, [router, token, refreshToken])

  useEffect(() => {
    if (!error) return
    const data = (error as LoginError)?.response?.data
    if (data?.errors) {
      for (const [field, code] of Object.entries(data.errors)) {
        setError(field as keyof LoginPayload, {
          type: "manual",
          message: FIELD_MESSAGES[code] ?? code,
        })
      }
    }
  }, [error, setError])

  const generalError = (() => {
    if (!error) return null
    const data = (error as LoginError)?.response?.data
    if (data?.errors) return null
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(" ") : data.message
    }
    return "Não foi possível entrar. Confira as credenciais."
  })()

  function onSubmit(values: LoginPayload) {
    mutate(values)
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-2">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `url(${assetPath("/news/hero-congress.png")})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden
        />
        <div className="relative flex items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={logoAlt}
              className="h-11 w-11 rounded-xl object-contain ring-1 ring-primary-foreground/20"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-foreground/10 ring-1 ring-primary-foreground/20">
              <Newspaper className="h-6 w-6" />
            </div>
          )}
          <div className="leading-tight">
            <p className="font-serif text-xl font-bold">{siteName}</p>
            <p className="text-xs text-accent">Painel Editorial</p>
          </div>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-balance font-serif text-4xl font-bold leading-tight">
            Gerencie o que o Brasil está lendo agora.
          </h1>
          <p className="mt-4 text-pretty leading-relaxed text-primary-foreground/70">
            Publique notícias, organize destaques e controle as campanhas
            publicitárias do portal em um só lugar.
          </p>
        </div>
        <p className="relative text-xs text-primary-foreground/50">
          &copy; {new Date().getFullYear()} {siteName}. Todos os direitos reservados.
        </p>
      </section>

      {/* Form panel */}
      <section className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao site
          </Link>

          <div className="mb-8">
            <h2 className="font-serif text-3xl font-bold text-foreground">Entrar</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Acesse o painel administrativo do portal.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@portal.com"
                  aria-invalid={Boolean(errors.email)}
                  className="pl-9"
                  {...register("email", { required: "Informe o e-mail." })}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={Boolean(errors.password)}
                  className="px-9"
                  {...register("password", { required: "Informe a senha." })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {generalError && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {generalError}
              </p>
            )}

            <Button type="submit" size="lg" disabled={isPending} className="mt-1">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? "Entrando..." : "Entrar no painel"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  )
}
