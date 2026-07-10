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

export async function getUserList(): Promise<UserListResponse> {
  const endpoints = [
    { url: API_ENDPOINTS.USER.LIST_ADMIN, source: 'admin' as const },
    { url: API_ENDPOINTS.USER.LIST_LEGACY, source: 'legacy' as const },
  ]

  let lastError: Error | null = null

  for (let index = 0; index < endpoints.length; index += 1) {
    const target = endpoints[index]
    const response = await fetch(target.url, {
      method: 'GET',
      headers: buildAuthHeaders(),
    })

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
    const data = rows.map(normalizeUser)

    return {
      code: code ?? 200,
      message: readSuccessMessage(payload),
      data,
      total: readEnvelopeTotal(payload, data.length),
      source: target.source,
    }
  }

  throw lastError ?? new Error('加载用户列表失败')
}
