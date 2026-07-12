// @vitest-environment jsdom

import React from 'react'
import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SessionTimeoutManager } from './SessionTimeoutManager'

const {
  navigateMock,
  refreshAdminSessionMock,
  setAdminTokenMock,
  clearAdminTokenMock,
  setAdminSessionMetaMock,
  recordActivityMock,
  buildSnapshotMock,
  serverNow,
  sessionState,
} = vi.hoisted(() => {
  const now = { value: 0 }
  const state = { expiresAt: 1, warningBefore: 300 }
  return {
    navigateMock: vi.fn(),
    refreshAdminSessionMock: vi.fn(),
    setAdminTokenMock: vi.fn(),
    clearAdminTokenMock: vi.fn(),
    setAdminSessionMetaMock: vi.fn(),
    recordActivityMock: vi.fn(),
    buildSnapshotMock: vi.fn(() => ({
      latest_activity_ts: 1,
      latest_activity_type: 'click',
      recent_activities: [{ type: 'click', ts: 1, route: '/index' }],
    })),
    serverNow: now,
    sessionState: state,
  }
})

vi.mock('react-router-dom', () => ({
  Outlet: () => <div>outlet</div>,
  useLocation: () => ({ pathname: '/admin/dashboard' }),
  useNavigate: () => navigateMock,
}))

vi.mock('antd', () => ({
  Modal: ({ open, children }: { open?: boolean; children?: React.ReactNode }) => (open ? <div>{children}</div> : null),
}))

vi.mock('../services/authService', () => ({
  ApiHttpError: class ApiHttpError extends Error {
    status: number

    constructor(message: string, status: number) {
      super(message)
      this.status = status
      this.name = 'ApiHttpError'
    }
  },
  refreshAdminSession: (...args: unknown[]) => refreshAdminSessionMock(...args),
}))

vi.mock('../services/sessionService', () => ({
  ADMIN_SESSION_EXPIRES_AT_STORAGE_KEY: 'admin_session_expires_at',
  ADMIN_SESSION_ACTIVITY_EVENTS_STORAGE_KEY: 'admin_session_activity_events',
  ADMIN_SESSION_SERVER_OFFSET_SECONDS_STORAGE_KEY: 'admin_session_server_offset_seconds',
  ADMIN_SESSION_WARNING_SECONDS_STORAGE_KEY: 'admin_session_warning_before_seconds',
  ADMIN_TOKEN_STORAGE_KEY: 'admin_token',
  computeCurrentServerEpochSeconds: () => serverNow.value,
  fallbackAdminSessionExpiresAtFromNow: () => 300,
  buildAdminSessionRefreshSnapshot: () => buildSnapshotMock(),
  clearAdminToken: (...args: unknown[]) => clearAdminTokenMock(...args),
  getAdminSessionExpiresAt: () => sessionState.expiresAt,
  getAdminSessionWarningBeforeSeconds: () => sessionState.warningBefore,
  getAdminToken: () => 'token-1',
  recordAdminSessionActivityEvent: (type: unknown, route: unknown) => recordActivityMock(type, route),
  setAdminSessionMeta: (...args: unknown[]) => setAdminSessionMetaMock(...args),
  setAdminToken: (token: unknown, meta: unknown) => setAdminTokenMock(token, meta),
}))

describe('SessionTimeoutManager', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    serverNow.value = 0
    sessionState.expiresAt = 1
    sessionState.warningBefore = 300

    setAdminTokenMock.mockImplementation((_: unknown, meta?: { expires_at?: number }) => {
      if (meta?.expires_at) {
        sessionState.expiresAt = meta.expires_at
      } else {
        sessionState.expiresAt = 120
      }
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should send one decision refresh with activity snapshot in warning window', async () => {
    refreshAdminSessionMock.mockResolvedValue({
      success: true,
      message: 'ok',
      access_token: 'token-2',
      expires_at: 3600,
      warning_before_seconds: 30,
      server_time: 10,
    })

    render(<SessionTimeoutManager />)

    await act(async () => {
      await Promise.resolve()
    })

    expect(buildSnapshotMock).toHaveBeenCalledTimes(1)
    expect(refreshAdminSessionMock).toHaveBeenCalledTimes(1)
    expect(setAdminTokenMock).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(refreshAdminSessionMock).toHaveBeenCalledTimes(1)
  })

  it('should logout on decision refresh 401', async () => {
    const { ApiHttpError } = await import('../services/authService')
    refreshAdminSessionMock.mockRejectedValue(new ApiHttpError('expired', 401))

    render(<SessionTimeoutManager />)

    await act(async () => {
      await Promise.resolve()
    })

    expect(clearAdminTokenMock).toHaveBeenCalledTimes(1)
    expect(navigateMock).toHaveBeenCalledTimes(1)
  })
})
