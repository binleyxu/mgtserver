import { API_ENDPOINTS } from '@/config'
import { buildAuthHeaders, handleUnauthorizedResponse } from '@/auth'
import { extractApiMessage, isBusinessSuccess, readEnvelopeCode, readEnvelopeDataObject, readHttpErrorMessage } from '@/utils/apiSemantics'

import type { UploadAvatarParams, UploadAvatarResult } from '../types/avatar.types'

function normalizePersistedAvatarUrl(value: unknown, fieldName: 'avatar_small_url' | 'avatar_large_url'): string {
  const normalized = typeof value === 'string' ? value.trim() : ''

  if (!normalized) {
    throw new Error(`头像上传失败：后端未返回 ${fieldName}`)
  }

  if (normalized.startsWith('data:image/')) {
    throw new Error('头像上传失败：后端返回了 base64 数据。请将头像文件落盘到 /static/avatar/... 并返回文件 URL，而不是 data:image/...')
  }

  return normalized
}

export async function uploadAdminAvatar({ adminId, file, crop, imageMeta }: UploadAvatarParams): Promise<UploadAvatarResult> {
  const normalizedAdminId = String(adminId ?? '').trim()
  if (!normalizedAdminId) {
    throw new Error('管理员 ID 无效，无法上传头像')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('crop_x', String(crop.x))
  formData.append('crop_y', String(crop.y))
  formData.append('crop_size', String(crop.size))
  formData.append('original_width', String(imageMeta.width))
  formData.append('original_height', String(imageMeta.height))

  const authHeaders = buildAuthHeaders()
  const { 'Content-Type': _, ...headersWithoutContentType } = authHeaders

  const primaryUrl = API_ENDPOINTS.ADMIN.AVATAR_UPLOAD(normalizedAdminId)
  const fallbackUrl = primaryUrl.startsWith('/api/') ? primaryUrl.replace('/api/', '/') : primaryUrl

  const uploadOnce = async (url: string) => {
    return fetch(url, {
      method: 'POST',
      headers: headersWithoutContentType,
      body: formData,
    })
  }

  let response = await uploadOnce(primaryUrl)
  if (response.status === 404 && fallbackUrl !== primaryUrl) {
    response = await uploadOnce(fallbackUrl)
  }

  handleUnauthorizedResponse(response)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('头像上传接口未就绪（404）：请确认后端已实现 POST /admin/{id}/avatar（或 /api/admin/{id}/avatar）')
    }
    throw new Error(await readHttpErrorMessage(response, `Failed to upload avatar: HTTP ${response.status}`))
  }

  const payload = await response.json()
  const code = readEnvelopeCode(payload)
  if (!isBusinessSuccess(code)) {
    throw new Error(extractApiMessage(payload) || '头像上传失败')
  }

  const data = readEnvelopeDataObject(payload) ?? (payload as Record<string, unknown>)
  const returnedAdminId = String(data.admin_id ?? normalizedAdminId)

  if (data.admin_id !== undefined && returnedAdminId !== normalizedAdminId) {
    throw new Error(`头像上传失败：返回的管理员 ID 不一致（请求 ${normalizedAdminId}，返回 ${returnedAdminId}）。请检查后端是否按路径 /admin/{id}/avatar 正确落盘到 /static/avatar/${normalizedAdminId}/。`)
  }

  return {
    adminId: returnedAdminId,
    avatarSmallUrl: normalizePersistedAvatarUrl(data.avatar_small_url, 'avatar_small_url'),
    avatarLargeUrl: normalizePersistedAvatarUrl(data.avatar_large_url, 'avatar_large_url'),
    avatarVersion: typeof data.avatar_version === 'number' ? data.avatar_version : undefined,
    avatarUpdatedAt: typeof data.avatar_updated_at === 'string' ? data.avatar_updated_at : undefined,
  }
}
