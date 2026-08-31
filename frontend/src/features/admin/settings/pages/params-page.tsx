"use client"

import { useRef, useState } from "react"
import { Save, RotateCcw, Image as ImageIcon, Loader2, Upload, X } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/admin-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import * as PARAMS from "@/lib/portal-params"
import { uploadSettingsFile } from "../services/files-service"
import { useSiteIdentityStore } from "@/stores/useSiteIdentityStore"

type ParamValue = number | string | boolean

type ParamMeta = {
  label: string
  description: string
  group: string
  type?: "number" | "text"
  min?: number
  max?: number
  placeholder?: string
}

const PARAM_META: Record<string, ParamMeta> = {
  MIN_NEWS_FOR_MIDDLE_BANNER: {
    label: "Mínimo notícias para banner central",
    description: "Quantas notícias devem existir na grade para o banner no meio da página aparecer.",
    group: "Página inicial — Grade",
    min: 1,
    max: 50,
  },
  BANNER_INTERVAL: {
    label: "Intervalo de banner na grade",
    description: "A cada quantas notícias na grade principal um banner é intercalado.",
    group: "Página inicial — Grade",
    min: 2,
    max: 20,
  },
  HERO_SECONDARY_COUNT: {
    label: "Notícias secundárias no hero",
    description: "Quantidade de cards ao lado direito da notícia em destaque.",
    group: "Página inicial — Hero",
    min: 1,
    max: 4,
  },
  MOST_READ_COUNT: {
    label: "Itens — Mais lidas",
    description: "Quantas notícias aparecem na caixa \"Mais lidas\" da sidebar.",
    group: "Página inicial — Sidebar",
    min: 3,
    max: 10,
  },
  LATEST_COUNT: {
    label: "Itens — Últimas notícias",
    description: "Quantas notícias aparecem na caixa \"Últimas notícias\" da sidebar.",
    group: "Página inicial — Sidebar",
    min: 3,
    max: 10,
  },
  SAW_THIS_BLOCK_SIZE: {
    label: "Itens por bloco — Viu isso?",
    description: "Máximo de notícias por bloco na seção \"Viu isso?\" antes de inserir um banner aside.",
    group: "Página inicial — Sidebar",
    min: 3,
    max: 10,
  },
  RELATED_NEWS_COUNT: {
    label: "Notícias relacionadas",
    description: "Quantidade de matérias relacionadas exibidas no rodapé de uma notícia.",
    group: "Detalhe de Notícia",
    min: 1,
    max: 6,
  },
  // PORTAL_NEWS_FETCH_LIMIT: {
  //   label: "Notícias por requisição (portal)",
  //   description: "Limite de notícias carregadas em uma requisição no portal.",
  //   group: "API — Limites de paginação",
  //   min: 1,
  //   max: 200,
  // },
  // CATEGORIES_FETCH_LIMIT: {
  //   label: "Categorias por requisição",
  //   description: "Limite de categorias carregadas por requisição.",
  //   group: "API — Limites de paginação",
  //   min: 1,
  //   max: 200,
  // },
  // AUTHORS_FETCH_LIMIT: {
  //   label: "Autores por requisição",
  //   description: "Limite de autores carregados por requisição.",
  //   group: "API — Limites de paginação",
  //   min: 1,
  //   max: 200,
  // },
  // TAGS_FETCH_LIMIT: {
  //   label: "Tags por requisição",
  //   description: "Limite de tags carregadas por requisição.",
  //   group: "API — Limites de paginação",
  //   min: 1,
  //   max: 200,
  // },
  // BANNERS_FETCH_LIMIT: {
  //   label: "Banners por requisição",
  //   description: "Limite de banners carregados por requisição.",
  //   group: "API — Limites de paginação",
  //   min: 1,
  //   max: 200,
  // },
  WHATSAPP_NUMBER: {
    label: "Número de WhatsApp",
    description: "Número usado nos links \"Anuncie conosco\" e \"Entre em contato\" do rodapé. Informe no formato internacional, apenas dígitos (ex.: 5562912345678).",
    group: "Rodapé do site",
    type: "text",
    placeholder: "5562912345678",
  },
  SITE_NAME: {
    label: "Nome do site",
    description: "Nome exibido no header, footer e painel administrativo.",
    group: "Identidade Visual",
    type: "text",
    placeholder: "Senador Canedo Hoje",
  },
  LOGO_URL: {
    label: "URL do logo",
    description: "Caminho da imagem do logo (ex.: /logo.png ou https://exemplo.com/logo.png). Quando vazio, apenas o texto é exibido.",
    group: "Identidade Visual",
    type: "text",
    placeholder: "/logo.png",
  },
  LOGO_ALT: {
    label: "Texto alternativo do logo",
    description: "Texto para acessibilidade do logo. Descreva o que a imagem representa.",
    group: "Identidade Visual",
    type: "text",
    placeholder: "Senador Canedo Hoje",
  },
}

type ParamKey = keyof typeof PARAM_META

const GROUPS = Array.from(new Set(Object.values(PARAM_META).map((m) => m.group)))

function groupEntries(values: Record<ParamKey, ParamValue>) {
  return GROUPS.map((group) => ({
    group,
    params: (Object.keys(PARAM_META) as ParamKey[]).filter(
      (k) => PARAM_META[k].group === group
    ),
  }))
}

export default function ParamsPage() {
  const setIdentity = useSiteIdentityStore((s) => s.setIdentity)
  const defaults = { ...PARAMS, SITE_NAME: useSiteIdentityStore.getState().name, LOGO_URL: useSiteIdentityStore.getState().logoUrl, LOGO_ALT: useSiteIdentityStore.getState().logoAlt, SHOW_NAME_WITH_LOGO: useSiteIdentityStore.getState().showNameWithLogo } as Record<ParamKey, ParamValue>
  const [values, setValues] = useState<Record<ParamKey, ParamValue>>({ ...defaults })
  const [saved, setSaved] = useState<Record<ParamKey, ParamValue>>({ ...defaults })
  const [uploading, setUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const isDirty = (Object.keys(values) as ParamKey[]).some((k) => values[k] !== saved[k])

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
      setValues((prev) => ({ ...prev, LOGO_URL: uploaded.path }))
      toast.success("Logo enviado com sucesso. Clique em Salvar alterações para aplicar.")
    } catch {
      toast.error("Não foi possível enviar a imagem.")
    } finally {
      setUploading(false)
    }
  }

  function handleChange(key: ParamKey, raw: string) {
    const meta = PARAM_META[key]
    if (meta.type === "text") {
      setValues((prev) => ({ ...prev, [key]: raw }))
      return
    }
    const parsed = parseInt(raw, 10)
    if (isNaN(parsed)) return
    setValues((prev) => ({ ...prev, [key]: parsed }))
  }

  function handleSave() {
    setSaved({ ...values })
    setIdentity({
      name: values.SITE_NAME as string,
      logoUrl: values.LOGO_URL as string,
      logoAlt: values.LOGO_ALT as string,
      showNameWithLogo: values.SHOW_NAME_WITH_LOGO === true,
    })
    toast.success("Parâmetros salvos com sucesso.", {
      description: "Os valores estão ativos nesta sessão do browser.",
    })
  }

  function handleReset() {
    setValues({ ...defaults })
    setSaved({ ...defaults })
    toast.info("Parâmetros restaurados para os valores padrão.")
  }

  return (
    <div className="p-6 lg:p-10 space-y-6">
      <PageHeader
        title="Parâmetros do Portal"
        description="Configure as constantes de comportamento da home, grade de notícias e limites de API."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              className="gap-2"
              disabled={!isDirty}
            >
              <RotateCcw className="h-4 w-4" />
              Restaurar padrões
            </Button>
            <Button onClick={handleSave} className="gap-2" disabled={!isDirty}>
              <Save className="h-4 w-4" />
              Salvar alterações
            </Button>
          </div>
        }
      />

      {groupEntries(values).map(({ group, params }) => (
        <Card key={group} className="border-border bg-card shadow-xs">
          <CardHeader className="px-2 py-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg text-black font-bold">{group}</CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              {group === "Identidade Visual"
                ? "Configure o nome e o logo exibidos em todo o site."
                : group.startsWith("API") ? "Controlam os limites enviados à API em cada requisição." : "Controlam o layout e a seleção de conteúdo."}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-2">
            {group === "Identidade Visual" && (
              <div className="mb-4 flex items-center gap-4 rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-muted/50">
                  {(values.LOGO_URL as string) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={values.LOGO_URL as string}
                      alt={(values.LOGO_ALT as string) || "Logo preview"}
                      className="h-14 w-14 rounded-lg object-contain"
                    />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{(values.SITE_NAME as string) || "Nome do site"}</p>
                  <p className="text-xs text-muted-foreground">
                    {(values.LOGO_URL as string) ? "Logo configurado" : "Nenhum logo configurado — apenas o texto será exibido"}
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
                      disabled={uploading}
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
                    {(values.LOGO_URL as string) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={uploading}
                        onClick={() => {
                          setValues((prev) => ({ ...prev, LOGO_URL: "" }))
                        }}
                        className="gap-2 text-muted-foreground"
                      >
                        <X className="h-4 w-4" />
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
            {group === "Identidade Visual" && (
              <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/20 p-4">
                <Checkbox
                  checked={values.SHOW_NAME_WITH_LOGO === true}
                  onCheckedChange={(checked) => {
                    const active = checked === true
                    setValues((prev) => ({ ...prev, SHOW_NAME_WITH_LOGO: active }))
                  }}
                  className="mt-0.5 data-checked:border-secondary data-checked:bg-secondary"
                />
                <span className="flex flex-col gap-1">
                  <span className="text-sm font-semibold leading-tight">
                    Mostrar nome do site junto ao logo na home
                  </span>
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    Quando marcado, o nome do site aparece ao lado do logo no cabeçalho da página
                    inicial. Se nenhum logo estiver configurado, o nome é sempre exibido.
                  </span>
                </span>
              </label>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {params.map((key) => {
                const meta = PARAM_META[key]
                const isModified = values[key] !== defaults[key]
                return (
                  <div
                    key={key}
                    className={`space-y-2 rounded-xl border p-4 transition-colors ${
                      isModified
                        ? "border-primary/30 bg-primary/5"
                        : "border-border bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Label
                        htmlFor={`param-${key}`}
                        className="text-sm font-semibold leading-tight"
                      >
                        {meta.label}
                      </Label>
                      {isModified && (
                        <Badge className="text-[10px] h-4 px-1.5 shrink-0">editado</Badge>
                      )}
                    </div>
                    <Input
                      id={`param-${key}`}
                      type={meta.type === "text" ? "text" : "number"}
                      min={meta.type === "text" ? undefined : meta.min}
                      max={meta.type === "text" ? undefined : meta.max}
                      placeholder={meta.placeholder}
                      value={values[key] as string | number}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="font-mono h-9"
                    />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {meta.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 font-mono">
                      padrão: {defaults[key]}
                      {meta.type !== "text" && meta.min !== undefined && meta.max !== undefined && (
                        <> · range: {meta.min}–{meta.max}</>
                      )}
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
