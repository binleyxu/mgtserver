import { describe, expect, it } from 'vitest'

import {
  ensureBusinessSuccess,
  extractApiMessage,
  isBusinessSuccess,
  readEnvelopeCode,
  readEnvelopeData,
  readEnvelopeDataObject,
  readEnvelopeItems,
  readEnvelopeTotal,
  readHttpErrorDetails,
  readHttpErrorMessage,
} from './apiSemantics'

describe('apiSemantics', () => {
  it('extractApiMessage should read message and detail', () => {
    expect(extractApiMessage(' direct message ')).toBe(' direct message ')
    expect(extractApiMessage({ message: '业务失败' })).toBe('业务失败')
    expect(extractApiMessage({ detail: 'detail text' })).toBe('detail text')
    expect(extractApiMessage({ detail: { message: 'nested detail' } })).toBe('nested detail')
    expect(extractApiMessage({})).toBeNull()
  })

  it('isBusinessSuccess should support configured success codes', () => {
    expect(isBusinessSuccess(0)).toBe(true)
    expect(isBusinessSuccess(200)).toBe(true)
    expect(isBusinessSuccess(undefined)).toBe(true)
    expect(isBusinessSuccess(null)).toBe(true)
    expect(isBusinessSuccess(5001)).toBe(false)
  })

  it('ensureBusinessSuccess should throw for non success code', () => {
    expect(() => ensureBusinessSuccess({ code: 0, data: {} }, 'fallback')).not.toThrow()
    expect(() => ensureBusinessSuccess({ code: 5001, message: '业务失败' }, 'fallback')).toThrow('业务失败')
    expect(() => ensureBusinessSuccess(null, 'fallback')).toThrow('fallback')
  })

  it('readEnvelope helpers should parse object and list variants', () => {
    const objectPayload = { code: 0, data: { items: [{ id: 1 }], total: 11 } }
    const arrayPayload = { code: 0, data: [{ id: 2 }, { id: 3 }] }

    expect(readEnvelopeCode(objectPayload)).toBe(0)
    expect(readEnvelopeData(objectPayload)).toEqual({ items: [{ id: 1 }], total: 11 })
    expect(readEnvelopeDataObject(objectPayload)).toEqual({ items: [{ id: 1 }], total: 11 })
    expect(readEnvelopeItems(objectPayload)).toEqual([{ id: 1 }])
    expect(readEnvelopeTotal(objectPayload, 0)).toBe(11)

    expect(readEnvelopeItems(arrayPayload)).toEqual([{ id: 2 }, { id: 3 }])
    expect(readEnvelopeTotal(arrayPayload, 2)).toBe(2)
  })

  it('readHttpErrorDetails should extract retry and lock metadata from JSON errors', async () => {
    const response = new Response(
      JSON.stringify({
        message: '请求过快',
        detail: {
          retry_after_seconds: 3600,
          lock_type: 'human',
        },
      }),
      {
        status: 429,
        headers: { 'content-type': 'application/json' },
      }
    )

    const details = await readHttpErrorDetails(response, 'fallback')
    expect(details.message).toBe('请求过快')
    expect(details.retryAfterSeconds).toBe(3600)
    expect(details.lockType).toBe('human')
  })

  it('readHttpErrorMessage should fallback to text when non-json', async () => {
    const response = new Response('plain error', {
      status: 500,
      headers: { 'content-type': 'text/plain' },
    })

    await expect(readHttpErrorMessage(response, 'fallback')).resolves.toBe('plain error')
  })
})
