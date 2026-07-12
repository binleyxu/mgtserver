import { API_ENDPOINTS } from '../../../config'
import { buildAuthHeaders, handleUnauthorizedResponse } from '@/auth'
import {
  extractApiMessage,
  isBusinessSuccess,
  readEnvelopeCode,
  readEnvelopeItems,
  readEnvelopeTotal,
  readHttpErrorMessage,
  readSuccessMessage,
} from '@/utils/apiSemantics'
import type { UserListResponse, UserProfile } from '../types/user.types'

const USER_LIST_REQUEST_TIMEOUT_MS = 8000

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    })
  } finally {
    globalThis.clearTimeout(timeoutId)
  }
}

function normalizeUser(item: Record<string, unknown>): UserProfile {
  const rawId = item.id ?? item.user_id ?? item.uid
  const statusValue = item.status

  return {
    id: rawId == null ? 0 : Number(rawId),
    uuid: String(item.uuid ?? ''),
    username: String(item.username ?? ''),
    nickname: String(item.nickname ?? ''),
    phone: item.phone == null ? null : String(item.phone),
    avatarUrl: item.avatar_url == null ? null : String(item.avatar_url),
    registerSource: String(item.register_source ?? 'unknown'),
    status:
      statusValue === false || String(statusValue).toLowerCase() === 'inactive'
        ? 'inactive'
        : 'active',
    createdAt: item.created_at == null ? null : String(item.created_at),
  }
}

export async function getUserList(page: number = 1, pageSize: number = 20): Promise<UserListResponse> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 20
  const endpoints = [
    { url: API_ENDPOINTS.USER.LIST_LEGACY(safePage, safePageSize), source: 'legacy' as const },
  ]

  let lastError: Error | null = null

  for (let index = 0; index < endpoints.length; index += 1) {
    const target = endpoints[index]
    let response: Response
    try {
      response = await fetchWithTimeout(target.url, {
        method: 'GET',
        headers: buildAuthHeaders(),
      }, USER_LIST_REQUEST_TIMEOUT_MS)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('用户数据查询超时，请稍后重试')
      }
      throw error
    }

    handleUnauthorizedResponse(response)

    if (!response.ok) {
      const message = await readHttpErrorMessage(response, `Failed to fetch user: HTTP ${response.status}`)
      const isLastEndpoint = index === endpoints.length - 1

      if (isLastEndpoint || response.status !== 404) {
        throw new Error(message)
      }

      lastError = new Error(message)
      continue
    }

    const payload = await response.json()
    const code = readEnvelopeCode(payload)
    if (!isBusinessSuccess(code)) {
      throw new Error(extractApiMessage(payload) || '加载用户列表失败')
    }

    const rows = readEnvelopeItems(payload) as Record<string, unknown>[]
    const normalizedRows = rows.map(normalizeUser)
    const total = readEnvelopeTotal(payload, normalizedRows.length)

    return {
      code: code ?? 200,
      message: readSuccessMessage(payload),
      data: normalizedRows,
      total,
      source: target.source,
    }
  }

  throw lastError ?? new Error('加载用户列表失败')
}
