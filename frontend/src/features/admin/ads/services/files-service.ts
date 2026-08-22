import { api } from "@/services/api"
import type { BannerFileRef } from "../types/banner"

type UploadResponse = {
  file: BannerFileRef
}

// O criativo do banner é um arquivo do acervo: sobe primeiro (POST files/upload)
// e referencia depois pelo id em items[].file.id.
export async function uploadFile(file: File): Promise<BannerFileRef> {
  const formData = new FormData()
  formData.append("file", file)
  const { data } = await api.post<UploadResponse>("files/upload", formData)
  return data.file
}
