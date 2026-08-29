"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type PromptTextConfig = {
  title: string
  description?: string
  label: string
  placeholder?: string
  defaultValue?: string
  confirmLabel?: string
}

type PromptContextValue = {
  promptText: (config: PromptTextConfig) => Promise<string | null>
}

const PromptContext = React.createContext<PromptContextValue | null>(null)

export function usePromptText() {
  const ctx = React.useContext(PromptContext)
  if (!ctx) {
    throw new Error("usePromptText must be used within a PromptProvider")
  }
  return ctx
}

export function PromptProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const [config, setConfig] = React.useState<PromptTextConfig>({ title: "", label: "" })
  const [value, setValue] = React.useState("")
  const resolverRef = React.useRef<((value: string | null) => void) | null>(null)

  const promptText = React.useCallback((next: PromptTextConfig) => {
    setConfig(next)
    setValue(next.defaultValue ?? "")
    setOpen(true)
    return new Promise<string | null>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const close = React.useCallback((result: string | null) => {
    setOpen(false)
    resolverRef.current?.(result)
    resolverRef.current = null
  }, [])

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!next) close(null)
    },
    [close]
  )

  return (
    <PromptContext.Provider value={{ promptText }}>
      {children}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{config.title}</DialogTitle>
            {config.description && (
              <DialogDescription>{config.description}</DialogDescription>
            )}
          </DialogHeader>

          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              close(value.trim() || null)
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="prompt-dialog-input">{config.label}</Label>
              <Input
                id="prompt-dialog-input"
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={config.placeholder}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => close(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!value.trim()}>
                {config.confirmLabel ?? "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PromptContext.Provider>
  )
}