import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  computeCurrentServerEpochSeconds,
  clearAdminToken,
  getAdminSessionExpiresAt,
  getAdminSessionLastActivityAt,
  getAdminSessionWarningBeforeSeconds,
  getAdminSessionStartedAt,
  getAdminToken,
  markAdminSessionActivity,
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
})
