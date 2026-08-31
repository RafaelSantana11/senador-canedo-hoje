import { api } from "@/services/api"

type UploadResponse = {
  file: {
    id: string
    path: string
  }
}

export async function uploadSettingsFile(file: File): Promise<{ id: string; path: string }> {
  const formData = new FormData()
  formData.append("file", file)
  const { data } = await api.post<UploadResponse>("files/upload", formData)
  return data.file
}
