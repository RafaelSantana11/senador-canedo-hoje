import { publicApi } from "@/services/api"
import type { PublicSettings } from "../types"

// `GET /settings` é público no servidor: o portal lê os parâmetros sem token
// (por isso `publicApi`). Escrita é restrita a admin e vive no painel.
export async function getPublicSettings(): Promise<PublicSettings> {
  const { data } = await publicApi.get<PublicSettings>("settings")
  return data
}
