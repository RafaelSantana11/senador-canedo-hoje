export type LoginPayload = {
  email: string
  password: string
}

export type RoleEntity = {
  id: number
  name: string
  __entity?: string
}

export type FileType = {
  id: string
  path: string
}

export type Author = {
  id: string
  slug: string
  bio: string | null
  isColumnist: boolean
  userId: number
  name: string
  photo: FileType | null
  createdAt: string
  updatedAt: string
}

export type AuthUser = {
  id: number
  email: string
  provider: string
  socialId: string | null
  name: string
  legalName: string | null
  photo: FileType | null
  role: RoleEntity
  status: string
  trialStartDate: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  author?: Author | null
}

export type LoginResponse = {
  refreshToken: string
  token: string
  tokenExpires: number
  user: AuthUser
}

export type RefreshResponse = {
  token: string
  refreshToken: string
  tokenExpires: number
}
