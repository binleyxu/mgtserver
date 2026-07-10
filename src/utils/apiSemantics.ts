export interface ApiEnvelope<T = unknown> {
  code?: number
  message?: string
  data?: T
  detail?: unknown
  success?: boolean
  [key: string]: unknown
}

export interface HttpErrorDetails {
  message: string
  retryAfterSeconds?: number
  lockType?: string
}

function extractDetailMessage(detail: unknown): string | null {
  if (typeof detail === 'string' && detail.trim()) {
    return detail
  }

  if (detail && typeof detail === 'object') {
    const maybeMessage = (detail as { message?: unknown }).message
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
      return maybeMessage
    }

    const maybeDetail = (detail as { detail?: unknown }).detail
    if (typeof maybeDetail === 'string' && maybeDetail.trim()) {
      return maybeDetail
    }
  }

  return null
}

export function extractApiMessage(payload: unknown): string | null {
  if (typeof payload === 'string' && payload.trim()) {
    return payload
  }

  if (!payload || typeof payload !== 'object') {
    return null
  }

  const envelope = payload as ApiEnvelope

  if (typeof envelope.message === 'string' && envelope.message.trim()) {
    return envelope.message
  }

  const detailMessage = extractDetailMessage(envelope.detail)
  if (detailMessage) {
    return detailMessage
  }

  return null
}

export function isBusinessSuccess(code: unknown): boolean {
  return code === 0 || code === 200 || code === undefined || code === null
}

export function readEnvelopeCode(payload: unknown): number | undefined {
  if (!payload || typeof payload !== 'object') {
    return undefined
  }

  const rawCode = (payload as ApiEnvelope).code
  return typeof rawCode === 'number' ? rawCode : undefined
}

export function ensureBusinessSuccess(payload: unknown, fallbackMessage: string): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') {
    throw new Error(fallbackMessage)
  }

  const code = readEnvelopeCode(payload)
  if (!isBusinessSuccess(code)) {
    throw new Error(extractApiMessage(payload) || fallbackMessage)
  }

  return payload as Record<string, unknown>
}

export function readSuccessMessage(payload: unknown, fallbackMessage: string = 'success'): string {
  return extractApiMessage(payload) || fallbackMessage
}

export function readEnvelopeData(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') {
    return payload
  }

  const body = payload as Record<string, unknown>
  return body.data === undefined ? body : body.data
}

export function readEnvelopeDataObject(payload: unknown): Record<string, unknown> | null {
  const data = readEnvelopeData(payload)
  return data && typeof data === 'object' && !Array.isArray(data)
    ? data as Record<string, unknown>
    : null
}

export function readEnvelopeItems(payload: unknown): unknown[] {
  if (!payload || typeof payload !== 'object') {
    return []
  }

  const body = payload as Record<string, unknown>
  if (Array.isArray(body.items)) {
    return body.items
  }

  const data = readEnvelopeDataObject(payload)
  if (data && Array.isArray(data.items)) {
    return data.items
  }

  const directData = readEnvelopeData(payload)
  if (Array.isArray(directData)) {
    return directData
  }

  return []
}

export function readEnvelopeTotal(payload: unknown, fallbackTotal: number): number {
  if (!payload || typeof payload !== 'object') {
    return fallbackTotal
  }

  const body = payload as Record<string, unknown>
  if (typeof body.total === 'number') {
    return body.total
  }

  const data = readEnvelopeDataObject(payload)
  if (data && typeof data.total === 'number') {
    return data.total
  }

  return fallbackTotal
}

export async function readHttpErrorMessage(response: Response, fallbackMessage: string): Promise<string> {
  const details = await readHttpErrorDetails(response, fallbackMessage)
  return details.message
}

export async function readHttpErrorDetails(response: Response, fallbackMessage: string): Promise<HttpErrorDetails> {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    try {
      const payload = await response.json()
      const message = extractApiMessage(payload)

      if (payload && typeof payload === 'object') {
        const body = payload as Record<string, unknown>
        const detail = body.detail && typeof body.detail === 'object'
          ? body.detail as Record<string, unknown>
          : null

        const retryAfterSeconds = typeof detail?.retry_after_seconds === 'number'
          ? detail.retry_after_seconds
          : typeof body.retry_after_seconds === 'number'
            ? body.retry_after_seconds
            : undefined

        const lockType = typeof detail?.lock_type === 'string'
          ? detail.lock_type
          : typeof body.lock_type === 'string'
            ? body.lock_type
            : undefined

        return {
          message: message || fallbackMessage,
          retryAfterSeconds,
          lockType,
        }
      }

      if (message) {
        return { message }
      }
    } catch {
      // ignore parse errors and continue fallback chain
    }
  }

  try {
    const text = await response.text()
    if (text.trim()) {
      return { message: text }
    }
  } catch {
    // ignore parse errors and continue fallback chain
  }

  return { message: fallbackMessage }
}
