import { useCallback, useEffect, useRef, useState } from 'react'
import { Modal } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import {
  ADMIN_SESSION_EXPIRES_AT_STORAGE_KEY,
  ADMIN_SESSION_ACTIVITY_EVENTS_STORAGE_KEY,
  ADMIN_SESSION_SERVER_OFFSET_SECONDS_STORAGE_KEY,
  ADMIN_SESSION_WARNING_SECONDS_STORAGE_KEY,
  ADMIN_TOKEN_STORAGE_KEY,
  buildAdminSessionRefreshSnapshot,
  computeCurrentServerEpochSeconds,
  fallbackAdminSessionExpiresAtFromNow,
  clearAdminToken,
  getAdminSessionExpiresAt,
  getAdminSessionWarningBeforeSeconds,
  getAdminToken,
  recordAdminSessionActivityEvent,
  setAdminSessionMeta,
  setAdminToken,
} from '../services/sessionService'
import { ApiHttpError, refreshAdminSession } from '../services/authService'

function formatRemaining(seconds: number): string {
  const safeSeconds = Math.max(0, seconds)
  const mins = Math.floor(safeSeconds / 60)
  const secs = safeSeconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function SessionTimeoutManager() {
  const navigate = useNavigate()
  const location = useLocation()
  const warningShownRef = useRef(false)
  const hasLoggedOutRef = useRef(false)
  const refreshingRef = useRef(false)
  const decisionTriggeredInWindowRef = useRef(false)
  const activityWriteThrottleMsRef = useRef(0)
  const [refreshing, setRefreshing] = useState(false)
  const [warningOpen, setWarningOpen] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  const logoutForTimeout = useCallback(() => {
    if (hasLoggedOutRef.current) {
      return
    }
    hasLoggedOutRef.current = true
    clearAdminToken()
    navigate('/login', {
      replace: true,
      state: {
        from: location.pathname,
      },
    })
  }, [location.pathname, navigate])

  const recordActivity = useCallback((type: string) => {
    const now = Date.now()
    if (now - activityWriteThrottleMsRef.current < 200) {
      return
    }
    activityWriteThrottleMsRef.current = now
    recordAdminSessionActivityEvent(type, location.pathname)
  }, [location.pathname])

  const applySessionRefresh = useCallback((refreshed: Awaited<ReturnType<typeof refreshAdminSession>>) => {
    setAdminToken(refreshed.access_token, {
      expires_at: refreshed.expires_at,
      expires_in: refreshed.expires_in,
      warning_before_seconds: refreshed.warning_before_seconds,
      server_time: refreshed.server_time,
    })
    decisionTriggeredInWindowRef.current = false
  }, [])

  const triggerWindowDecisionRefresh = useCallback(async () => {
    if (refreshingRef.current || decisionTriggeredInWindowRef.current) {
      return
    }

    decisionTriggeredInWindowRef.current = true
    refreshingRef.current = true
    setRefreshing(true)

    try {
      const refreshed = await refreshAdminSession(buildAdminSessionRefreshSnapshot())
      applySessionRefresh(refreshed)
      warningShownRef.current = false
      setWarningOpen(false)
    } catch (error) {
      if (error instanceof ApiHttpError && error.status === 401) {
        logoutForTimeout()
        return
      }
      // Keep user in warning state; allow manual continue retry.
      setWarningOpen(true)
    } finally {
      refreshingRef.current = false
      setRefreshing(false)
    }
  }, [applySessionRefresh, logoutForTimeout])

  const evaluateSession = useCallback(() => {
    const token = getAdminToken()
    if (!token) {
      return
    }

    let expiresAt = getAdminSessionExpiresAt()
    if (!expiresAt) {
      expiresAt = fallbackAdminSessionExpiresAtFromNow()
      setAdminSessionMeta(token, { expires_at: expiresAt })
    }

    const remaining = Math.floor(expiresAt - computeCurrentServerEpochSeconds())
    setRemainingSeconds(Math.max(remaining, 0))

    if (remaining <= 0) {
      // Keep the user in-place while a refresh request is in-flight.
      if (refreshingRef.current) {
        setWarningOpen(true)
        return
      }
      setWarningOpen(false)
      logoutForTimeout()
      return
    }

    const warningBeforeSeconds = getAdminSessionWarningBeforeSeconds()
    if (remaining <= warningBeforeSeconds) {
      if (!decisionTriggeredInWindowRef.current) {
        void triggerWindowDecisionRefresh()
      }
      if (!warningShownRef.current) {
        warningShownRef.current = true
        setWarningOpen(true)
      }
      return
    }

    warningShownRef.current = false
    setWarningOpen(false)
  }, [logoutForTimeout, triggerWindowDecisionRefresh])

  const handleContinueSession = useCallback(async () => {
    try {
      refreshingRef.current = true
      setRefreshing(true)
      recordAdminSessionActivityEvent('manual_continue', location.pathname)
      const refreshed = await refreshAdminSession(buildAdminSessionRefreshSnapshot())
      applySessionRefresh(refreshed)
      warningShownRef.current = false
      setWarningOpen(false)
      evaluateSession()
    } catch (error) {
      if (error instanceof ApiHttpError && error.status === 401) {
        logoutForTimeout()
        return
      }

      Modal.error({
        title: '会话续期失败',
        content: error instanceof Error ? error.message : '会话续期失败，请重新登录。',
      })
    } finally {
      refreshingRef.current = false
      setRefreshing(false)
    }
  }, [applySessionRefresh, evaluateSession, location.pathname, logoutForTimeout])

  const handleLogoutNow = useCallback(() => {
    setWarningOpen(false)
    logoutForTimeout()
  }, [logoutForTimeout])

  useEffect(() => {
    if (!getAdminToken()) {
      return
    }

    recordAdminSessionActivityEvent('page_load', location.pathname)
    evaluateSession()

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        recordActivity('visibility_visible')
        evaluateSession()
      }
    }

    const onClick = () => {
      recordActivity('click')
    }

    const onScroll = () => {
      recordActivity('scroll')
    }

    const onKeydown = () => {
      recordActivity('keydown')
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key === ADMIN_TOKEN_STORAGE_KEY && event.newValue === null) {
        logoutForTimeout()
        return
      }

      if (
        event.key === ADMIN_SESSION_EXPIRES_AT_STORAGE_KEY
        || event.key === ADMIN_SESSION_WARNING_SECONDS_STORAGE_KEY
        || event.key === ADMIN_SESSION_SERVER_OFFSET_SECONDS_STORAGE_KEY
        || event.key === ADMIN_SESSION_ACTIVITY_EVENTS_STORAGE_KEY
      ) {
        evaluateSession()
      }
    }

    const intervalId = window.setInterval(evaluateSession, 1000)
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('click', onClick, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('keydown', onKeydown)
    window.addEventListener('storage', onStorage)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('click', onClick)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('keydown', onKeydown)
      window.removeEventListener('storage', onStorage)
    }
  }, [evaluateSession, location.pathname, logoutForTimeout, recordActivity])

  useEffect(() => {
    if (!getAdminToken()) {
      return
    }
    recordAdminSessionActivityEvent('route_change', location.pathname)
  }, [location.pathname])

  return (
    <>
      <Outlet />
      <Modal
        title="会话即将过期"
        open={warningOpen}
        okText="继续会话"
        cancelText="立即退出"
        onOk={handleContinueSession}
        onCancel={handleLogoutNow}
        closable={false}
        maskClosable={false}
        keyboard={false}
        confirmLoading={refreshing}
      >
        <p>当前登录会话将在 {formatRemaining(remainingSeconds)} 后过期。</p>
      </Modal>
    </>
  )
}

export default SessionTimeoutManager
