"use client"

import { useState } from "react"
import { Save, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/admin-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import * as PARAMS from "@/lib/portal-params"

type ParamKey = keyof typeof PARAMS

const PARAM_META: Record<
  ParamKey,
  { label: string; description: string; group: string; min?: number; max?: number }
> = {
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
}

const GROUPS = Array.from(new Set(Object.values(PARAM_META).map((m) => m.group)))

function groupEntries(values: Record<ParamKey, number>) {
  return GROUPS.map((group) => ({
    group,
    params: (Object.keys(PARAM_META) as ParamKey[]).filter(
      (k) => PARAM_META[k].group === group
    ),
  }))
}

export default function ParamsPage() {
  const defaults = PARAMS as Record<ParamKey, number>
  const [values, setValues] = useState<Record<ParamKey, number>>({ ...defaults })
  const [saved, setSaved] = useState<Record<ParamKey, number>>({ ...defaults })

  const isDirty = (Object.keys(values) as ParamKey[]).some((k) => values[k] !== saved[k])

  function handleChange(key: ParamKey, raw: string) {
    const parsed = parseInt(raw, 10)
    if (isNaN(parsed)) return
    setValues((prev) => ({ ...prev, [key]: parsed }))
  }

  function handleSave() {
    setSaved({ ...values })
    toast.success("Parâmetros salvos com sucesso.", {
      description: "Os valores estão ativos nesta sessão do browser. Para persistir entre deploys, edite portal-params.ts.",
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
          <CardHeader className="p-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono font-bold">
                {params.length} parâmetros
              </Badge>
              <CardTitle className="text-lg text-black">{group}</CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              {group.startsWith("API") ? "Controlam os limites enviados à API em cada requisição." : "Controlam o layout e a seleção de conteúdo."}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-2">
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
                      type="number"
                      min={meta.min}
                      max={meta.max}
                      value={values[key]}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="font-mono h-9"
                    />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {meta.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 font-mono">
                      padrão: {defaults[key]}
                      {meta.min !== undefined && meta.max !== undefined && (
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
