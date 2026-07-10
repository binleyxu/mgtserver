export interface UserProfile {
  id: number
  uuid: string
  username: string
  nickname: string
  phone?: string | null
  avatarUrl?: string | null
  registerSource: string
  status: 'active' | 'inactive'
  createdAt?: string | null
}

export interface UserListResponse {
  code: number
  message: string
  data: UserProfile[]
  total: number
  source: 'admin' | 'legacy'
}
