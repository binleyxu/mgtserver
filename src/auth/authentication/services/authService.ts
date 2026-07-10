import { API_BASE_URL, API_ENDPOINTS } from '../../../config'
import type { AdminLoginRequest, AdminLoginResponse } from '../types/auth.types'
import { extractApiMessage, isBusinessSuccess, readEnvelopeCode, readHttpErrorDetails } from '../../../utils/apiSemantics'
import { clearAdminToken as clearAdminTokenInStorage, setAdminToken as setAdminTokenInStorage } from './sessionService'

export class ApiHttpError extends Error {
  status: number
  retryAfterSeconds?: number
  lockType?: string

  constructor(message: string, status: number, retryAfterSeconds?: number, lockType?: string) {
    super(message)
    this.name = 'ApiHttpError'
    this.status = status
    this.retryAfterSeconds = retryAfterSeconds
    this.lockType = lockType
  }
}

function normalizeLoginResponse(payload: unknown): AdminLoginResponse {
  if (!payload || typeof payload !== 'object') {
    throw new Error('登录响应格式错误')
  }

  const body = payload as Record<string, unknown>
  const code = readEnvelopeCode(body)
  const message = extractApiMessage(body) || '登录失败'

  if (!isBusinessSuccess(code)) {
    throw new Error(message)
  }

  const directToken = typeof body.access_token === 'string' ? body.access_token : null
  const data = body.data && typeof body.data === 'object' ? (body.data as Record<string, unknown>) : null
  const nestedToken = data && typeof data.access_token === 'string'
    ? data.access_token
    : data && typeof data.token === 'string'
      ? data.token
      : null

  const accessToken = directToken || nestedToken
  if (!accessToken) {
    throw new Error(message || '登录成功但未返回令牌')
  }

  const tokenType = typeof body.token_type === 'string'
    ? body.token_type
    : data && typeof data.token_type === 'string'
      ? data.token_type
      : 'bearer'

  return {
    success: true,
    message: typeof body.message === 'string' ? body.message : '登录成功',
    access_token: accessToken,
    token_type: tokenType,
  }
}

export async function loginAdmin(
  data: AdminLoginRequest
): Promise<AdminLoginResponse> {
  try {
    const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const payload = await readHttpErrorDetails(response, `HTTP ${response.status}`)
      throw new ApiHttpError(payload.message, response.status, payload.retryAfterSeconds, payload.lockType)
    }

    const payload = await response.json()
    return normalizeLoginResponse(payload)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error'
    console.error(`[Auth] Login error: ${message}. API URL: ${API_BASE_URL}`)
    throw error
  }
}

export async function getHumanChallenge(): Promise<{ id: string; nonce?: string; expires_in?: number }> {
  const response = await fetch(API_ENDPOINTS.AUTH.CHALLENGE, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const payload = await readHttpErrorDetails(response, `HTTP ${response.status}`)
    throw new ApiHttpError(`Failed to get human challenge: ${payload.message}`, response.status, payload.retryAfterSeconds, payload.lockType)
  }

  const payload = await response.json()
  if (payload && typeof payload === 'object') {
    const body = payload as Record<string, unknown>
    const code = readEnvelopeCode(body)
    if (!isBusinessSuccess(code)) {
      throw new Error(extractApiMessage(body) || '获取人机挑战失败')
    }

    const maybeData = body.data && typeof body.data === 'object' ? body.data as Record<string, unknown> : body
    const id = typeof maybeData.id === 'string' ? maybeData.id : ''
    const nonce = typeof maybeData.nonce === 'string' ? maybeData.nonce : undefined
    const expiresIn = typeof maybeData.expires_in === 'number' ? maybeData.expires_in : undefined

    if (!id) {
      throw new Error('获取人机挑战失败：缺少 challenge id')
    }

    return { id, nonce, expires_in: expiresIn }
  }

  throw new Error('获取人机挑战失败：响应格式错误')
}

export function setAdminToken(token: string) {
  setAdminTokenInStorage(token)
}

export function clearAdminToken() {
  clearAdminTokenInStorage()
}

