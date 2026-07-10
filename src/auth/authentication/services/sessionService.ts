const ADMIN_TOKEN_KEY = 'admin_token'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length < 2) {
    return null
  }

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((ch) => `%${(`00${ch.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    )
    const payload = JSON.parse(json)
    return payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null
  } catch {
    return null
  }
}

export function getAdminToken(): string | null {
  if (!isBrowser()) {
    return null
  }
  return window.localStorage.getItem(ADMIN_TOKEN_KEY)
}

export function getAdminIdFromToken(token?: string | null): string | null {
  const target = token ?? getAdminToken()
  if (!target) {
    return null
  }

  const payload = decodeJwtPayload(target)
  if (!payload) {
    return null
  }

  const sub = payload.sub
  if (typeof sub === 'string' || typeof sub === 'number') {
    return String(sub)
  }

  return null
}

export function getAdminRoleFromToken(token?: string | null): string | null {
  const target = token ?? getAdminToken()
  if (!target) {
    return null
  }

  const payload = decodeJwtPayload(target)
  if (!payload) {
    return null
  }

  return typeof payload.role === 'string' ? payload.role : null
}

export function setAdminToken(token: string): void {
  if (!isBrowser()) {
    return
  }
  window.localStorage.setItem(ADMIN_TOKEN_KEY, token)
}

export function clearAdminToken(): void {
  if (!isBrowser()) {
    return
  }
  window.localStorage.removeItem(ADMIN_TOKEN_KEY)
}

export function buildAuthHeaders(baseHeaders?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(baseHeaders || {}),
  }

  const token = getAdminToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

export function handleUnauthorizedResponse(response: Response): void {
  if (response.status !== 401 || !isBrowser()) {
    return
  }

  clearAdminToken()
  window.location.href = '/login'
}
