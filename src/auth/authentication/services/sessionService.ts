import { SESSION_TIMEOUT_SECONDS, SESSION_WARNING_SECONDS } from '../../../config'
import type { AdminSessionMeta } from '../types/auth.types'

export const ADMIN_TOKEN_STORAGE_KEY = 'admin_token'
export const ADMIN_SESSION_STARTED_AT_STORAGE_KEY = 'admin_session_started_at'
export const ADMIN_SESSION_LAST_ACTIVITY_AT_STORAGE_KEY = 'admin_session_last_activity_at'
export const ADMIN_SESSION_EXPIRES_AT_STORAGE_KEY = 'admin_session_expires_at'
export const ADMIN_SESSION_WARNING_SECONDS_STORAGE_KEY = 'admin_session_warning_before_seconds'
export const ADMIN_SESSION_SERVER_OFFSET_SECONDS_STORAGE_KEY = 'admin_session_server_offset_seconds'

function nowMs(): number {
  return Date.now()
}

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

function getJwtExpSeconds(token: string): number | null {
  const payload = decodeJwtPayload(token)
  if (!payload) {
    return null
  }

  const exp = payload.exp
  if (typeof exp === 'number' && Number.isFinite(exp) && exp > 0) {
    return Math.floor(exp)
  }

  return null
}

export function getAdminToken(): string | null {
  if (!isBrowser()) {
    return null
  }
  return window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)
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

export function setAdminToken(token: string, sessionMeta?: AdminSessionMeta): void {
  if (!isBrowser()) {
    return
  }
  window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token)
  initializeAdminSessionTimestamps()
  setAdminSessionMeta(token, sessionMeta)
}

export function clearAdminToken(): void {
  if (!isBrowser()) {
    return
  }
  window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
  clearAdminSessionTimestamps()
  clearAdminSessionMeta()
}

function readTimestamp(key: string): number | null {
  if (!isBrowser()) {
    return null
  }

  const raw = window.localStorage.getItem(key)
  if (!raw) {
    return null
  }

  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export function getAdminSessionStartedAt(): number | null {
  return readTimestamp(ADMIN_SESSION_STARTED_AT_STORAGE_KEY)
}

export function getAdminSessionLastActivityAt(): number | null {
  return readTimestamp(ADMIN_SESSION_LAST_ACTIVITY_AT_STORAGE_KEY)
}

export function initializeAdminSessionTimestamps(): void {
  if (!isBrowser()) {
    return
  }

  const now = nowMs()
  if (!getAdminSessionStartedAt()) {
    window.localStorage.setItem(ADMIN_SESSION_STARTED_AT_STORAGE_KEY, String(now))
  }
  window.localStorage.setItem(ADMIN_SESSION_LAST_ACTIVITY_AT_STORAGE_KEY, String(now))
}

export function markAdminSessionActivity(timestampMs?: number): void {
  if (!isBrowser()) {
    return
  }

  const value = timestampMs ?? nowMs()
  window.localStorage.setItem(ADMIN_SESSION_LAST_ACTIVITY_AT_STORAGE_KEY, String(value))

  if (!getAdminSessionStartedAt()) {
    window.localStorage.setItem(ADMIN_SESSION_STARTED_AT_STORAGE_KEY, String(value))
  }
}

export function clearAdminSessionTimestamps(): void {
  if (!isBrowser()) {
    return
  }
  window.localStorage.removeItem(ADMIN_SESSION_STARTED_AT_STORAGE_KEY)
  window.localStorage.removeItem(ADMIN_SESSION_LAST_ACTIVITY_AT_STORAGE_KEY)
}

function readNumberLike(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return null
}

function writeNumberIfPositive(key: string, value?: number): void {
  if (!isBrowser()) {
    return
  }

  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    window.localStorage.setItem(key, String(Math.floor(value)))
    return
  }

  window.localStorage.removeItem(key)
}

function writeNumberIfFinite(key: string, value?: number): void {
  if (!isBrowser()) {
    return
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    window.localStorage.setItem(key, String(Math.floor(value)))
    return
  }

  window.localStorage.removeItem(key)
}

export function setAdminSessionMeta(token: string, sessionMeta?: AdminSessionMeta): void {
  if (!isBrowser()) {
    return
  }

  const nowSeconds = Math.floor(nowMs() / 1000)
  const serverTime = readNumberLike(sessionMeta?.server_time)
  const expiresIn = readNumberLike(sessionMeta?.expires_in)
  const expiresAtRaw = readNumberLike(sessionMeta?.expires_at)
  const jwtExp = getJwtExpSeconds(token)

  const resolvedExpiresAt =
    (expiresAtRaw && expiresAtRaw > 0 ? Math.floor(expiresAtRaw) : null)
    ?? (expiresIn && expiresIn > 0 ? nowSeconds + Math.floor(expiresIn) : null)
    ?? jwtExp

  const warningBeforeSeconds = readNumberLike(sessionMeta?.warning_before_seconds)

  if (serverTime && serverTime > 0) {
    const offsetSeconds = Math.floor(serverTime - nowSeconds)
    writeNumberIfFinite(ADMIN_SESSION_SERVER_OFFSET_SECONDS_STORAGE_KEY, offsetSeconds)
  }

  writeNumberIfPositive(ADMIN_SESSION_EXPIRES_AT_STORAGE_KEY, resolvedExpiresAt ?? undefined)
  writeNumberIfPositive(ADMIN_SESSION_WARNING_SECONDS_STORAGE_KEY, warningBeforeSeconds ?? SESSION_WARNING_SECONDS)
}

function readSessionNumber(key: string): number | null {
  const value = readTimestamp(key)
  if (value && value > 0) {
    return value
  }

  if (!isBrowser()) {
    return null
  }

  const raw = window.localStorage.getItem(key)
  if (!raw) {
    return null
  }
  const parsed = Number.parseFloat(raw)
  return Number.isFinite(parsed) ? parsed : null
}

export function getAdminSessionExpiresAt(): number | null {
  const stored = readSessionNumber(ADMIN_SESSION_EXPIRES_AT_STORAGE_KEY)
  if (stored && stored > 0) {
    return Math.floor(stored)
  }

  const token = getAdminToken()
  if (!token) {
    return null
  }

  const exp = getJwtExpSeconds(token)
  if (exp && exp > 0 && isBrowser()) {
    window.localStorage.setItem(ADMIN_SESSION_EXPIRES_AT_STORAGE_KEY, String(exp))
  }

  return exp
}

export function getAdminSessionWarningBeforeSeconds(): number {
  const stored = readSessionNumber(ADMIN_SESSION_WARNING_SECONDS_STORAGE_KEY)
  if (stored && stored > 0) {
    return Math.floor(stored)
  }
  return SESSION_WARNING_SECONDS
}

export function getAdminSessionServerOffsetSeconds(): number {
  const stored = readSessionNumber(ADMIN_SESSION_SERVER_OFFSET_SECONDS_STORAGE_KEY)
  if (!stored || !Number.isFinite(stored)) {
    return 0
  }
  return Math.floor(stored)
}

export function computeCurrentServerEpochSeconds(): number {
  const nowSeconds = Math.floor(nowMs() / 1000)
  return nowSeconds + getAdminSessionServerOffsetSeconds()
}

export function clearAdminSessionMeta(): void {
  if (!isBrowser()) {
    return
  }
  window.localStorage.removeItem(ADMIN_SESSION_EXPIRES_AT_STORAGE_KEY)
  window.localStorage.removeItem(ADMIN_SESSION_WARNING_SECONDS_STORAGE_KEY)
  window.localStorage.removeItem(ADMIN_SESSION_SERVER_OFFSET_SECONDS_STORAGE_KEY)
}

export function fallbackAdminSessionExpiresAtFromNow(): number {
  return Math.floor(nowMs() / 1000) + SESSION_TIMEOUT_SECONDS
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
