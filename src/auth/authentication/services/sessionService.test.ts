import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  buildAdminSessionRefreshSnapshot,
  computeCurrentServerEpochSeconds,
  clearAdminToken,
  getAdminSessionActivityEvents,
  getAdminSessionExpiresAt,
  getAdminSessionLastActivityAt,
  getAdminSessionWarningBeforeSeconds,
  getAdminSessionStartedAt,
  getAdminToken,
  markAdminSessionActivity,
  recordAdminSessionActivityEvent,
  setAdminToken,
} from './sessionService'

class MemoryStorage {
  private data = new Map<string, string>()

  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }

  removeItem(key: string): void {
    this.data.delete(key)
  }

  clear(): void {
    this.data.clear()
  }
}

describe('sessionService', () => {
  let originalWindow: unknown

  beforeEach(() => {
    originalWindow = (globalThis as { window?: unknown }).window
    ;(globalThis as { window: Window }).window = {
      localStorage: new MemoryStorage(),
    } as unknown as Window
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (typeof originalWindow === 'undefined') {
      delete (globalThis as { window?: unknown }).window
      return
    }
    ;(globalThis as { window: unknown }).window = originalWindow
  })

  it('should initialize session timestamps when setting token', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000)

    setAdminToken('token-a', {
      expires_at: 3_600,
      warning_before_seconds: 300,
      server_time: 1,
    })

    expect(getAdminToken()).toBe('token-a')
    expect(getAdminSessionStartedAt()).toBe(1_000)
    expect(getAdminSessionLastActivityAt()).toBe(1_000)
    expect(getAdminSessionExpiresAt()).toBe(3_600)
    expect(getAdminSessionWarningBeforeSeconds()).toBe(300)
  })

  it('should update session activity timestamp', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000)
    setAdminToken('token-a')

    markAdminSessionActivity(4_000)

    expect(getAdminSessionStartedAt()).toBe(1_000)
    expect(getAdminSessionLastActivityAt()).toBe(4_000)
  })

  it('should clear token and session timestamps together', () => {
    setAdminToken('token-a', { expires_at: 5_400 })
    markAdminSessionActivity(5_000)

    clearAdminToken()

    expect(getAdminToken()).toBeNull()
    expect(getAdminSessionStartedAt()).toBeNull()
    expect(getAdminSessionLastActivityAt()).toBeNull()
    expect(getAdminSessionExpiresAt()).toBeNull()
  })

  it('should use server offset when computing server epoch time', () => {
    vi.spyOn(Date, 'now').mockReturnValue(10_000)
    setAdminToken('token-a', { expires_at: 100, server_time: 15 })

    expect(computeCurrentServerEpochSeconds()).toBe(15)
  })

  it('should keep only latest 5 local activity events', () => {
    vi.spyOn(Date, 'now').mockImplementationOnce(() => 1_000)
    recordAdminSessionActivityEvent('click', '/index')
    vi.spyOn(Date, 'now').mockImplementationOnce(() => 2_000)
    recordAdminSessionActivityEvent('scroll', '/index')
    vi.spyOn(Date, 'now').mockImplementationOnce(() => 3_000)
    recordAdminSessionActivityEvent('keydown', '/index')
    vi.spyOn(Date, 'now').mockImplementationOnce(() => 4_000)
    recordAdminSessionActivityEvent('route_change', '/user')
    vi.spyOn(Date, 'now').mockImplementationOnce(() => 5_000)
    recordAdminSessionActivityEvent('page_load', '/user')
    vi.spyOn(Date, 'now').mockImplementationOnce(() => 6_000)
    recordAdminSessionActivityEvent('manual_continue', '/user')

    const events = getAdminSessionActivityEvents()
    expect(events).toHaveLength(5)
    expect(events[0].type).toBe('scroll')
    expect(events[4].type).toBe('manual_continue')
    expect(events[4].ts).toBe(6_000)

    const snapshot = buildAdminSessionRefreshSnapshot()
    expect(snapshot.latest_activity_type).toBe('manual_continue')
    expect(snapshot.latest_activity_ts).toBe(6_000)
    expect(snapshot.recent_activities).toHaveLength(5)
  })

  it('should clear local activity events when clearing token', () => {
    setAdminToken('token-a', { expires_at: 3_600 })
    recordAdminSessionActivityEvent('click', '/index')
    expect(getAdminSessionActivityEvents()).toHaveLength(1)

    clearAdminToken()

    expect(getAdminSessionActivityEvents()).toHaveLength(0)
  })
})
