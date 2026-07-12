export const ROLE_VIEWER = "viewer"
export const ROLE_ADMIN = "admin"
export const ROLE_OPS_ADMIN = "ops_admin"
export const ROLE_SUPER_ADMIN = "super_admin"
export const ROLE_USER = "user"

export const READ_ROLES = [ROLE_VIEWER, ROLE_OPS_ADMIN, ROLE_ADMIN, ROLE_SUPER_ADMIN] as const
export const WRITE_ROLES = [ROLE_ADMIN, ROLE_SUPER_ADMIN] as const
export const ALL_ROLES = [...READ_ROLES, ROLE_USER] as const

const READ_ROLE_SET = new Set<string>(READ_ROLES)
const WRITE_ROLE_SET = new Set<string>(WRITE_ROLES)

export type AdminRole = (typeof ALL_ROLES)[number]

export function hasReadPermission(role?: string | null): boolean {
  return Boolean(role && READ_ROLE_SET.has(role))
}

export function hasWritePermission(role?: string | null): boolean {
  return Boolean(role && WRITE_ROLE_SET.has(role))
}

export function isUserRole(role?: string | null): boolean {
  return role === ROLE_USER
}

export function canAccessAdminAndSettings(role?: string | null): boolean {
  return hasWritePermission(role)
}
