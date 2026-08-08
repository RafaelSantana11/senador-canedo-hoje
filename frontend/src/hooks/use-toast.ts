"use client"

import { toast as sonnerToast } from "sonner"

type ToastOptions = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

function toast({ title, description, variant = "default" }: ToastOptions) {
  if (variant === "destructive") {
    return sonnerToast.error(title ?? "Erro", { description })
  }
  return sonnerToast(title ?? "", { description })
}

function useToast() {
  return { toast }
}

export { toast, useToast }
