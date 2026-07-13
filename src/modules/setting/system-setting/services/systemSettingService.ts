import type { SystemSettingProfile, SystemSettingResponse } from '../types/systemSetting.types'
import { API_ENDPOINTS } from '../../../../config'
import { buildAuthHeaders, handleUnauthorizedResponse } from '@/auth'
import {
  ensureBusinessSuccess,
  readEnvelopeCode,
  readEnvelopeDataObject,
  readHttpErrorMessage,
  readSuccessMessage,
} from '../../../../utils/apiSemantics'

const defaultSystemSettingProfile: SystemSettingProfile = {
  id: 1,
  siteTitle: '管理端',
  maintenanceMode: false,
  updatedAt: '',
  updatedBy: null,
}

type SystemSettingPatch = Pick<SystemSettingProfile, 'siteTitle' | 'maintenanceMode'>

function toBooleanFlag(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value === 1
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') {
      return true
    }
    if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') {
      return false
    }
  }

  return fallback
}

function getAuthHeaders(): Record<string, string> {
  return buildAuthHeaders()
}

function mapSettingData(payload: unknown): SystemSettingProfile {
  const data = readEnvelopeDataObject(payload) ?? {}
  const id = typeof data.id === 'number' ? data.id : defaultSystemSettingProfile.id
  const rawSiteTitle = typeof data.site_title === 'string'
    ? data.site_title
    : typeof data.siteTitle === 'string'
      ? data.siteTitle
      : ''
  const siteTitle = rawSiteTitle.trim()
    ? rawSiteTitle.trim()
    : defaultSystemSettingProfile.siteTitle
  const maintenanceSource = data.maintenance_mode ?? data.maintenanceMode
  const maintenanceMode = toBooleanFlag(maintenanceSource, defaultSystemSettingProfile.maintenanceMode)
  const updatedAtSource = typeof data.updated_at === 'string'
    ? data.updated_at
    : typeof data.updatedAt === 'string'
      ? data.updatedAt
      : ''
  const updatedAt = updatedAtSource
    ? updatedAtSource
    : defaultSystemSettingProfile.updatedAt
  const updatedBySource = data.updated_by ?? data.updatedBy
  const updatedBy = typeof updatedBySource === 'number' ? updatedBySource : null

  return {
    id,
    siteTitle,
    maintenanceMode,
    updatedAt,
    updatedBy,
  }
}

export async function getSystemSettingProfile(): Promise<SystemSettingResponse> {
  const response = await fetch(API_ENDPOINTS.SETTING.SYSTEM_SETTING, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  handleUnauthorizedResponse(response)

  if (!response.ok) {
    throw new Error(await readHttpErrorMessage(response, `Failed to fetch system setting: HTTP ${response.status}`))
  }

  const payload = await response.json()
  const body = ensureBusinessSuccess(payload, '加载系统设置失败')

  return {
    code: readEnvelopeCode(body) ?? 200,
    message: readSuccessMessage(body),
    data: mapSettingData(body),
  }
}

export async function updateSystemSettingProfile(
  patch: SystemSettingPatch,
): Promise<SystemSettingResponse> {
  const response = await fetch(API_ENDPOINTS.SETTING.SYSTEM_SETTING, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      site_title: patch.siteTitle.trim(),
      maintenance_mode: patch.maintenanceMode,
    }),
  })

  handleUnauthorizedResponse(response)

  if (!response.ok) {
    throw new Error(await readHttpErrorMessage(response, `Failed to update system setting: HTTP ${response.status}`))
  }

  const payload = await response.json()
  const body = ensureBusinessSuccess(payload, '保存系统设置失败')

  return {
    code: readEnvelopeCode(body) ?? 200,
    message: readSuccessMessage(body, '保存成功'),
    data: mapSettingData(body),
  }
}
