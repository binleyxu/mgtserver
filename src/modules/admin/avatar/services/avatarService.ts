import { API_ENDPOINTS } from '@/config'
import { buildAuthHeaders, handleUnauthorizedResponse } from '@/auth'
import { extractApiMessage, isBusinessSuccess, readEnvelopeCode, readEnvelopeDataObject, readHttpErrorMessage } from '@/utils/apiSemantics'

import type { UploadAvatarParams, UploadAvatarResult } from '../types/avatar.types'

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

  return {
    adminId: String(data.admin_id ?? normalizedAdminId),
    avatarSmallUrl: String(data.avatar_small_url ?? ''),
    avatarLargeUrl: String(data.avatar_large_url ?? ''),
    avatarVersion: typeof data.avatar_version === 'number' ? data.avatar_version : undefined,
    avatarUpdatedAt: typeof data.avatar_updated_at === 'string' ? data.avatar_updated_at : undefined,
  }
}
