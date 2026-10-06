"use client"

import { useMemo, useRef, useState } from "react"
import {
  Save,
  RotateCcw,
  Image as ImageIcon,
  Loader2,
  Upload,
  X,
  WifiOff,
} from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/admin-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
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
import * as PARAMS from "@/lib/portal-params"
import { formatRelativeTime } from "@/features/portal/home/utils/format-relative-time"
import { useAuthStore } from "@/stores/useAuthStore"
import { uploadSettingsFile } from "../services/files-service"
import { useSettings } from "../hooks/use-settings"
import { useUpdateSettings } from "../hooks/use-update-settings"
import { useResetSettings } from "../hooks/use-reset-settings"
import {
  settingsErrorMessage,
  settingsFieldErrors,
} from "../utils/settings-error"
import {
  SETTING_KEYS,
  type SettingKey,
  type Settings,
  type SettingsLogo,
  type SettingsPatch,
} from "../types/settings"

// Os valores vêm de `GET /settings` (todos os parâmetros, com os defaults
// mesclados no servidor). O que continua no front é só o metadado de UI —
// label, grupo, faixa e os defaults de código, usados no hint "padrão:" e no
// skeleton. A validação de faixa/formato é do servidor: aqui há só uma
// pré-checagem para o erro aparecer antes do request.

type ParamKind = "number" | "text" | "email" | "whatsapp"

type ParamMeta = {
  label: string
  description: string
  group: string
  kind: ParamKind
  min?: number
  max?: number
  placeholder?: string
}

const PARAM_META = {
  MIN_NEWS_FOR_MIDDLE_BANNER: {
    label: "Mínimo notícias para banner central",
    description:
      "Quantas notícias devem existir na grade para o banner no meio da página aparecer.",
    group: "Página inicial — Grade",
    kind: "number",
    min: 1,
    max: 50,
  },
  BANNER_INTERVAL: {
    label: "Intervalo de banner na grade",
    description:
      "A cada quantas notícias na grade principal um banner é intercalado.",
    group: "Página inicial — Grade",
    kind: "number",
    min: 2,
    max: 20,
  },
  HERO_SECONDARY_COUNT: {
    label: "Notícias secundárias no hero",
    description: "Quantidade de cards ao lado direito da notícia em destaque.",
    group: "Página inicial — Hero",
    kind: "number",
    min: 1,
    max: 4,
  },
  MOST_READ_COUNT: {
    label: "Itens — Mais lidas",
    description: 'Quantas notícias aparecem na caixa "Mais lidas" da sidebar.',
    group: "Página inicial — Sidebar",
    kind: "number",
    min: 3,
    max: 10,
  },
  LATEST_COUNT: {
    label: "Itens — Últimas notícias",
    description:
      'Quantas notícias aparecem na caixa "Últimas notícias" da sidebar.',
    group: "Página inicial — Sidebar",
    kind: "number",
    min: 3,
    max: 10,
  },
  SAW_THIS_BLOCK_SIZE: {
    label: "Itens por bloco — Viu isso?",
    description:
      'Máximo de notícias por bloco na seção "Viu isso?" antes de inserir um banner aside.',
    group: "Página inicial — Sidebar",
    kind: "number",
    min: 3,
    max: 10,
  },
  RELATED_NEWS_COUNT: {
    label: "Notícias relacionadas",
    description:
      "Quantidade de matérias relacionadas exibidas no rodapé de uma notícia.",
    group: "Detalhe de Notícia",
    kind: "number",
    min: 1,
    max: 6,
  },
  WHATSAPP_NUMBER: {
    label: "Número de WhatsApp",
    description:
      'Número usado nos links "Anuncie conosco" e "Entre em contato" do rodapé. Informe no formato internacional, apenas dígitos (ex.: 5562912345678).',
    group: "Rodapé do site",
    kind: "whatsapp",
    placeholder: "5562912345678",
  },
  CONTACT_EMAIL: {
    label: "E-mail de contato",
    description:
      "Endereço para o leitor falar com a administração do site. Por padrão, é o e-mail do administrador do painel; ao personalizar, deixa de acompanhar trocas futuras.",
    group: "Rodapé do site",
    kind: "email",
    placeholder: "contato@exemplo.com.br",
  },
  SITE_NAME: {
    label: "Nome do site",
    description: "Nome exibido no header, footer e painel administrativo.",
    group: "Identidade Visual",
    kind: "text",
    placeholder: "Senador Canedo Hoje",
  },
  LOGO_ALT: {
    label: "Texto alternativo do logo",
    description:
      "Texto para acessibilidade do logo. Descreva o que a imagem representa.",
    group: "Identidade Visual",
    kind: "text",
    placeholder: "Senador Canedo Hoje",
  },
} satisfies Record<string, ParamMeta>

type ParamKey = keyof typeof PARAM_META

const PARAM_KEYS = Object.keys(PARAM_META) as ParamKey[]

const GROUPS = Array.from(new Set(Object.values(PARAM_META).map((m) => m.group)))

const NUMERIC_KEYS = new Set<SettingKey>(
  PARAM_KEYS.filter((key) => PARAM_META[key].kind === "number")
)

/** Defaults de código, só para o hint "padrão:". O e-mail de contato não é constante. */
const PARAM_DEFAULTS = {
  MIN_NEWS_FOR_MIDDLE_BANNER: PARAMS.MIN_NEWS_FOR_MIDDLE_BANNER,
  BANNER_INTERVAL: PARAMS.BANNER_INTERVAL,
  HERO_SECONDARY_COUNT: PARAMS.HERO_SECONDARY_COUNT,
  MOST_READ_COUNT: PARAMS.MOST_READ_COUNT,
  LATEST_COUNT: PARAMS.LATEST_COUNT,
  SAW_THIS_BLOCK_SIZE: PARAMS.SAW_THIS_BLOCK_SIZE,
  RELATED_NEWS_COUNT: PARAMS.RELATED_NEWS_COUNT,
  WHATSAPP_NUMBER: PARAMS.WHATSAPP_NUMBER,
  SITE_NAME: PARAMS.SITE_NAME,
  LOGO_ALT: PARAMS.LOGO_ALT,
} satisfies Record<Exclude<ParamKey, "CONTACT_EMAIL">, number | string>

type FormValue = number | string | boolean | SettingsLogo | null
type FormValues = Record<SettingKey, FormValue>

function toFormValues(settings: Settings): FormValues {
  const values = {} as FormValues
  for (const key of SETTING_KEYS) {
    values[key] = settings[key] as FormValue
  }
  return values
}

/** Inteiro digitado como string no input; `null` quando vazio ou não numérico. */
function numericValue(raw: FormValue): number | null {
  if (typeof raw === "number") return Number.isInteger(raw) ? raw : null
  const text = String(raw).trim()
  if (!text) return null
  const parsed = Number(text)
  return Number.isInteger(parsed) ? parsed : null
}

function logoId(value: FormValue): string | null {
  return (value as SettingsLogo | null)?.id ?? null
}

/** "Sujo" é diferente do último valor do servidor — o que ainda não foi salvo. */
function isDirtyValue(key: SettingKey, raw: FormValue, server: FormValue): boolean {
  if (NUMERIC_KEYS.has(key)) return numericValue(raw) !== server
  if (key === "LOGO") return logoId(raw) !== logoId(server)
  if (key === "CONTACT_EMAIL") {
    // `null` no servidor = seguindo o e-mail do admin; o input vazio equivale.
    const rawText = typeof raw === "string" ? raw.trim() : ""
    const serverText = typeof server === "string" ? server : ""
    return rawText !== serverText
  }
  return raw !== server
}

function validate(values: FormValues): Partial<Record<SettingKey, string>> {
  const errors: Partial<Record<SettingKey, string>> = {}
  for (const key of PARAM_KEYS) {
    const meta = PARAM_META[key]
    if (meta.kind !== "number") continue

    const parsed = numericValue(values[key])
    if (parsed === null) {
      errors[key] = "Informe um número inteiro."
    } else if (meta.min !== undefined && parsed < meta.min) {
      errors[key] = `Mínimo: ${meta.min}.`
    } else if (meta.max !== undefined && parsed > meta.max) {
      errors[key] = `Máximo: ${meta.max}.`
    }
  }
  return errors
}

/** Só as chaves sujas viram corpo do PATCH — o resto fica intocado no servidor. */
function buildPatch(values: FormValues, server: Settings): SettingsPatch {
  const patch: Record<string, unknown> = {}

  for (const key of SETTING_KEYS) {
    const raw = values[key]
    if (!isDirtyValue(key, raw, server[key] as FormValue)) continue

    if (key === "LOGO") {
      // O `path` do eco do upload é descartado: o servidor só usa o `id`.
      patch.LOGO = raw ? { id: logoId(raw) } : null
    } else if (NUMERIC_KEYS.has(key)) {
      patch[key] = numericValue(raw)
    } else {
      patch[key] = raw
    }
  }

  return patch as SettingsPatch
}

function groupEntries() {
  return GROUPS.map((group) => ({
    group,
    params: PARAM_KEYS.filter((key) => PARAM_META[key].group === group),
  }))
}

const GROUP_DESCRIPTIONS: Record<string, string> = {
  "Identidade Visual": "Configure o nome e o logo exibidos em todo o site.",
  "Rodapé do site": "Contato exibido no rodapé de todas as páginas.",
  "Detalhe de Notícia": "Controla o rodapé de uma matéria.",
}

export default function ParamsPage() {
  const { data, isLoading, isError, refetch, isFetching } = useSettings()
  const updateSettings = useUpdateSettings()
  const resetSettings = useResetSettings()
  const user = useAuthStore((state) => state.user)
  const isAdmin = user?.role?.name === "Admin" || user?.role?.id === 1

  const [draft, setDraft] = useState<Partial<FormValues> | null>(null)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<SettingKey, string>>
  >({})
  const [resetOpen, setResetOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Valores exibidos = último valor do servidor + edições locais. Estado
  // derivado (sem efeito): um refetch em background não apaga o que o editor
  // ainda não salvou.
  const values = useMemo<FormValues | null>(() => {
    if (!data) return null
    const base = toFormValues(data)
    return draft ? { ...base, ...draft } : base
  }, [data, draft])

  const dirtyKeys = useMemo(() => {
    if (!values || !data) return [] as SettingKey[]
    return SETTING_KEYS.filter((key) =>
      isDirtyValue(key, values[key], data[key] as FormValue)
    )
  }, [values, data])

  const isDirty = dirtyKeys.length > 0
  const saving = updateSettings.isPending || resetSettings.isPending

  function clearError(key: SettingKey) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function handleChange(key: ParamKey, raw: string) {
    setDraft((prev) => ({ ...(prev ?? {}), [key]: raw }))
    clearError(key)
  }

  function handleBooleanChange(key: SettingKey, checked: boolean) {
    setDraft((prev) => ({ ...(prev ?? {}), [key]: checked }))
    clearError(key)
  }

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    const accepted = ["image/jpeg", "image/png", "image/gif"]
    if (!accepted.includes(file.type)) {
      toast.error("Formato inválido. Use jpg, png ou gif.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem precisa ter até 5 MB.")
      return
    }

    try {
      setUploading(true)
      const uploaded = await uploadSettingsFile(file)
      setDraft((prev) => ({
        ...(prev ?? {}),
        LOGO: { id: uploaded.id, path: uploaded.path },
      }))
      clearError("LOGO")
      toast.success("Logo enviado. Clique em Salvar alterações para aplicar.")
    } catch {
      toast.error("Não foi possível enviar a imagem.")
    } finally {
      setUploading(false)
    }
  }

  /** O `data` do servidor já foi substituído pelas mutações; aqui só limpa o rascunho. */
  function applyServerSettings() {
    setDraft(null)
    setFieldErrors({})
  }

  async function handleSave() {
    if (!values || !data) return

    const localErrors = validate(values)
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors)
      toast.error("Revise os campos destacados.")
      return
    }

    const patch = buildPatch(values, data)
    if (Object.keys(patch).length === 0) return

    try {
      await updateSettings.mutateAsync(patch)
      // O servidor normaliza (trim, minúsculas) e a mutação já substituiu o
      // cache: limpar o rascunho faz o form refletir o que foi gravado.
      applyServerSettings()
      toast.success("Parâmetros salvos com sucesso.", {
        description: "As alterações já valem para todos os visitantes do portal.",
      })
    } catch (error) {
      const mapped: Partial<Record<SettingKey, string>> = {}
      for (const item of settingsFieldErrors(error)) {
        if (item.field !== "settings") mapped[item.field] = item.message
      }
      setFieldErrors(mapped)
      toast.error(settingsErrorMessage(error))
    }
  }

  async function handleReset() {
    try {
      await resetSettings.mutateAsync()
      applyServerSettings()
      setResetOpen(false)
      toast.info("Parâmetros restaurados para os valores padrão.", {
        description: "Todas as chaves, inclusive logo e e-mail de contato.",
      })
    } catch (error) {
      toast.error(settingsErrorMessage(error))
    }
  }

  /** `null` apaga a personalização e volta a seguir o e-mail do admin. */
  async function handleContactEmailReset() {
    try {
      await updateSettings.mutateAsync({ CONTACT_EMAIL: null })
      // Ação pontual: não descarta rascunhos dos outros campos.
      setDraft((prev) => {
        if (!prev) return prev
        const next = { ...prev }
        delete next.CONTACT_EMAIL
        return next
      })
      clearError("CONTACT_EMAIL")
      toast.info("O contato voltou a usar o e-mail do administrador.")
    } catch (error) {
      toast.error(settingsErrorMessage(error))
    }
  }

  if (isLoading || !values) {
    if (isError) {
      return (
        <div className="p-6 lg:p-10">
          <Card className="border-border bg-card shadow-xs">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <WifiOff className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Não foi possível carregar os parâmetros.
              </p>
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
      <div className="space-y-6 p-6 lg:p-10">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const logo = values.LOGO as SettingsLogo | null
  const lastChange = data?.updatedAt
    ? `Última alteração ${formatRelativeTime(data.updatedAt)}${
        data.updatedBy ? ` por ${data.updatedBy.name}` : ""
      }.`
    : "Nenhuma alteração salva — todos os parâmetros estão nos valores padrão."

  return (
    <div className="space-y-6 p-6 lg:p-10">
      <PageHeader
        title="Parâmetros do Portal"
        description="Configure o comportamento da home, da grade de notícias e a identidade do site. Os valores valem para todos os visitantes."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setResetOpen(true)}
              className="gap-2"
              disabled={!isAdmin || saving || !data?.updatedAt}
            >
              <RotateCcw className="h-4 w-4" />
              Restaurar padrões
            </Button>
            <Button
              onClick={handleSave}
              className="gap-2"
              disabled={!isAdmin || !isDirty || saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar alterações
            </Button>
          </div>
        }
      />

      <p className="text-xs text-muted-foreground">{lastChange}</p>

      {!isAdmin && (
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Somente administradores podem alterar os parâmetros. Você está vendo
          os valores atuais.
        </div>
      )}

      {groupEntries().map(({ group, params }) => (
        <Card key={group} className="border-border bg-card shadow-xs">
          <CardHeader className="px-2 py-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold text-black">
                {group}
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              {GROUP_DESCRIPTIONS[group] ??
                "Controlam o layout e a seleção de conteúdo."}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-2">
            {group === "Identidade Visual" && (
              <>
                <div className="mb-4 flex items-center gap-4 rounded-xl border border-border bg-muted/20 p-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-muted/50">
                    {logo?.path ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logo.path}
                        alt={(values.LOGO_ALT as string) || "Pré-visualização do logo"}
                        className="h-14 w-14 rounded-lg object-contain"
                      />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">
                        {(values.SITE_NAME as string) || "Nome do site"}
                      </p>
                      {dirtyKeys.includes("LOGO") && (
                        <Badge className="h-4 shrink-0 px-1.5 text-[10px]">
                          não salvo
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {logo?.path
                        ? "Logo configurado"
                        : "Nenhum logo configurado — apenas o texto será exibido"}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!isAdmin || uploading || saving}
                        onClick={() => logoInputRef.current?.click()}
                        className="gap-2"
                      >
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        {uploading ? "Enviando..." : "Enviar logo"}
                      </Button>
                      {logo?.path && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={!isAdmin || uploading || saving}
                          onClick={() => {
                            setDraft((prev) => ({ ...(prev ?? {}), LOGO: null }))
                            clearError("LOGO")
                          }}
                          className="gap-2 text-muted-foreground"
                        >
                          <X className="h-4 w-4" />
                          Remover
                        </Button>
                      )}
                    </div>
                    {fieldErrors.LOGO && (
                      <p className="mt-2 text-[11px] text-destructive">
                        {fieldErrors.LOGO}
                      </p>
                    )}
                  </div>
                </div>

                <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/20 p-4">
                  <Checkbox
                    checked={values.SHOW_NAME_WITH_LOGO === true}
                    disabled={!isAdmin || saving}
                    onCheckedChange={(checked) =>
                      handleBooleanChange(
                        "SHOW_NAME_WITH_LOGO",
                        checked === true
                      )
                    }
                    className="mt-0.5 data-checked:border-secondary data-checked:bg-secondary"
                  />
                  <span className="flex flex-col gap-1">
                    <span className="flex items-center gap-2 text-sm leading-tight font-semibold">
                      Mostrar nome do site junto ao logo na home
                      {dirtyKeys.includes("SHOW_NAME_WITH_LOGO") && (
                        <Badge className="h-4 shrink-0 px-1.5 text-[10px]">
                          não salvo
                        </Badge>
                      )}
                    </span>
                    <span className="text-xs leading-relaxed text-muted-foreground">
                      Quando marcado, o nome do site aparece ao lado do logo no
                      cabeçalho da página inicial. Se nenhum logo estiver
                      configurado, o nome é sempre exibido.
                    </span>
                  </span>
                </label>
              </>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {params.map((key) => {
                const meta: ParamMeta = PARAM_META[key]
                const error = fieldErrors[key]
                const unsaved = dirtyKeys.includes(key)
                const value = values[key]
                const isEmail = key === "CONTACT_EMAIL"

                return (
                  <div
                    key={key}
                    className={`space-y-2 rounded-xl border p-4 transition-colors ${
                      error
                        ? "border-destructive/40 bg-destructive/5"
                        : unsaved
                          ? "border-primary/30 bg-primary/5"
                          : "border-border bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Label
                        htmlFor={`param-${key}`}
                        className="text-sm leading-tight font-semibold"
                      >
                        {meta.label}
                      </Label>
                      {unsaved && (
                        <Badge className="h-4 shrink-0 px-1.5 text-[10px]">
                          não salvo
                        </Badge>
                      )}
                    </div>

                    <Input
                      id={`param-${key}`}
                      type={meta.kind === "number" ? "number" : "text"}
                      inputMode={
                        meta.kind === "number"
                          ? "numeric"
                          : meta.kind === "email"
                            ? "email"
                            : meta.kind === "whatsapp"
                              ? "tel"
                              : undefined
                      }
                      min={meta.min}
                      max={meta.max}
                      placeholder={meta.placeholder}
                      disabled={!isAdmin || saving}
                      value={String(value ?? "")}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="h-9 font-mono"
                    />

                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {meta.description}
                    </p>

                    {error ? (
                      <p className="text-[11px] font-medium text-destructive">
                        {error}
                      </p>
                    ) : (
                      <p className="font-mono text-[10px] text-muted-foreground/60">
                        {isEmail ? (
                          data?.contactEmailIsDefault ? (
                            <>padrão: e-mail do administrador</>
                          ) : (
                            <>personalizado</>
                          )
                        ) : (
                          <>
                            padrão: {PARAM_DEFAULTS[key as keyof typeof PARAM_DEFAULTS]}
                            {meta.kind === "number" &&
                              meta.min !== undefined &&
                              meta.max !== undefined && (
                                <> · range: {meta.min}–{meta.max}</>
                              )}
                          </>
                        )}
                      </p>
                    )}

                    {isEmail && !data?.contactEmailIsDefault && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={!isAdmin || saving}
                        onClick={handleContactEmailReset}
                        className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Voltar ao padrão
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar os padrões?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os parâmetros voltam aos valores de fábrica — inclusive o
              logo, o nome do site e o e-mail de contato. Isso vale para todos
              os visitantes do portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resetSettings.isPending ? "Restaurando..." : "Restaurar padrões"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
