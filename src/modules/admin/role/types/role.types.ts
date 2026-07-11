export interface Role {
  id: number
  role_name: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface RoleListResponse {
  total: number
  items: Role[]
}

export interface CreateRoleRequest {
  role_name: string
  is_active?: boolean
}

export interface UpdateRoleRequest {
  role_name?: string
  is_active?: boolean
}
