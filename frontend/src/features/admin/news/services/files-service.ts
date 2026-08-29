import { api } from "@/services/api"
import type { NewsCover } from "../types/news"

type UploadResponse = {
  file: NewsCover
}

export async function uploadCover(file: File): Promise<NewsCover> {
  const formData = new FormData()
  formData.append("file", file)
  const { data } = await api.post<UploadResponse>("files/upload", formData)
  return data.file
}

export async function uploadContentImage(file: File): Promise<string> {
  const cover = await uploadCover(file)
  return cover.path
}
