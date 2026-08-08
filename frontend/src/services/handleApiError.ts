import type { AxiosError } from "axios"
import { toast } from "@/hooks/use-toast"

type ResponseProps = {
  data: unknown
}

type ErrorData = {
  message?: string
  error?: string
}

export function handleApiError(error: unknown, response: ResponseProps): ResponseProps {
  const axiosError = error as AxiosError<ErrorData>

  if (axiosError.response) {
    const data = axiosError.response.data

    const message =
      data?.message || data?.error || "Ocorreu um erro ao processar sua solicitação"

    toast({ title: message })
    return response
  }

  if (axiosError.request) {
    toast({
      title: "Servidor indisponível. Tente novamente mais tarde",
      variant: "destructive",
    })

    return response
  }

  toast({
    title: "Erro inesperado. Tente novamente",
    variant: "destructive",
  })
  return response
}
