export type LoginPayload = {
  email: string
  password: string
}

export type RoleEntity = {
  id: number
  name: string
  __entity?: string
}

export type AuthUser = {
  id: number
  email: string
  provider: string
  socialId: string | null
  name: string
  legalName: string | null
  role: RoleEntity
  status: string
  trialStartDate: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export type LoginResponse = {
  refreshToken: string
  token: string
  tokenExpires: number
  user: AuthUser
}
