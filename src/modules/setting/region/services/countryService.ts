import { API_ENDPOINTS } from '../../../../config'
import type { CountryListResponse, CountrySyncResponse, CountrySyncRunsResponse, CountryUpdateDisplayNameResponse } from '../types/country.types'
import { ensureBusinessSuccess, readEnvelopeCode, readEnvelopeData, readHttpErrorMessage, readSuccessMessage } from '../../../../utils/apiSemantics'
import { buildAuthHeaders } from '@/auth'

function getAuthHeaders(): Record<string, string> {
  return buildAuthHeaders()
}

export async function getCountryList(): Promise<CountryListResponse> {
  const response = await fetch(API_ENDPOINTS.REGION.COUNTRY_LIST, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error(await readHttpErrorMessage(response, `Failed to fetch country list: HTTP ${response.status}`))
  }

  const payload = await response.json()
  const body = ensureBusinessSuccess(payload, '加载国家数据失败')
  const unpackedData = readEnvelopeData(body)
  const data = Array.isArray(unpackedData) ? unpackedData : []
  const total = typeof body.total === 'number' ? body.total : data.length

  return {
    code: readEnvelopeCode(body) ?? 200,
    message: readSuccessMessage(body),
    data,
    total,
  }
}

export async function triggerCountrySync(signal?: AbortSignal): Promise<CountrySyncResponse> {
  const response = await fetch(API_ENDPOINTS.REGION.COUNTRY_SYNC, {
    method: 'POST',
    headers: getAuthHeaders(),
    signal,
  })

  if (!response.ok) {
    throw new Error(await readHttpErrorMessage(response, `Failed to sync country: HTTP ${response.status}`))
  }

  const payload = await response.json()
  const body = ensureBusinessSuccess(payload, '同步失败')
  const unpackedData = readEnvelopeData(body)
  const data = unpackedData && typeof unpackedData === 'object' ? unpackedData : body

  return {
    code: readEnvelopeCode(body) ?? 200,
    message: readSuccessMessage(body),
    data: data as CountrySyncResponse['data'],
  }
}

export async function requestCancelLatestCountrySync(options?: { keepalive?: boolean; suppressError?: boolean }): Promise<boolean> {
  try {
    const response = await fetch(API_ENDPOINTS.REGION.COUNTRY_SYNC_CANCEL_LATEST, {
      method: 'POST',
      headers: getAuthHeaders(),
      keepalive: options?.keepalive,
    })

    if (!response.ok) {
      throw new Error(await readHttpErrorMessage(response, `Failed to cancel country sync: HTTP ${response.status}`))
    }

    const payload = await response.json()
    const body = ensureBusinessSuccess(payload, '取消同步失败')
    const data = body.data && typeof body.data === 'object' ? body.data as { cancelled?: unknown } : null
    return Boolean(data?.cancelled)
  } catch (error) {
    if (options?.suppressError) {
      return false
    }
    throw error
  }
}

export async function getCountrySyncRuns(): Promise<CountrySyncRunsResponse> {
  const response = await fetch(API_ENDPOINTS.REGION.COUNTRY_SYNC_RUNS, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error(await readHttpErrorMessage(response, `Failed to fetch country sync runs: HTTP ${response.status}`))
  }

  const payload = await response.json()
  const body = ensureBusinessSuccess(payload, '加载同步日志失败')
  const unpackedData = readEnvelopeData(body)
  const data = Array.isArray(unpackedData) ? unpackedData : []

  return {
    code: readEnvelopeCode(body) ?? 200,
    message: readSuccessMessage(body),
    data: data as CountrySyncRunsResponse['data'],
  }
}

export async function updateCountryDisplayName(countryId: number, nameCommon: string): Promise<CountryUpdateDisplayNameResponse> {
  const response = await fetch(API_ENDPOINTS.REGION.COUNTRY_DISPLAY_NAME_UPDATE(countryId), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ nameCommon }),
  })

  if (!response.ok) {
    throw new Error(await readHttpErrorMessage(response, `Failed to update country display name: HTTP ${response.status}`))
  }

  const payload = await response.json()
  const body = ensureBusinessSuccess(payload, '保存失败')
  const unpackedData = readEnvelopeData(body)
  const data = unpackedData && typeof unpackedData === 'object' ? unpackedData : body

  return {
    code: readEnvelopeCode(body) ?? 200,
    message: readSuccessMessage(body),
    data: data as CountryUpdateDisplayNameResponse['data'],
  }
}
