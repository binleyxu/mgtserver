import { useCallback, useEffect, useRef, useState } from 'react'
import { Modal } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import {
  ADMIN_SESSION_EXPIRES_AT_STORAGE_KEY,
  ADMIN_SESSION_SERVER_OFFSET_SECONDS_STORAGE_KEY,
  ADMIN_SESSION_WARNING_SECONDS_STORAGE_KEY,
  ADMIN_TOKEN_STORAGE_KEY,
  computeCurrentServerEpochSeconds,
  fallbackAdminSessionExpiresAtFromNow,
  clearAdminToken,
  getAdminSessionExpiresAt,
  getAdminSessionWarningBeforeSeconds,
  getAdminToken,
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
      setWarningOpen(false)
      logoutForTimeout()
      return
    }

    const warningBeforeSeconds = getAdminSessionWarningBeforeSeconds()
    if (remaining <= warningBeforeSeconds) {
      if (!warningShownRef.current) {
        warningShownRef.current = true
        setWarningOpen(true)
      }
      return
    }

    warningShownRef.current = false
    setWarningOpen(false)
  }, [logoutForTimeout])

  const handleContinueSession = useCallback(async () => {
    try {
      setRefreshing(true)
      const refreshed = await refreshAdminSession()
      setAdminToken(refreshed.access_token, {
        expires_at: refreshed.expires_at,
        expires_in: refreshed.expires_in,
        warning_before_seconds: refreshed.warning_before_seconds,
        server_time: refreshed.server_time,
      })
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
      setRefreshing(false)
    }
  }, [evaluateSession, logoutForTimeout])

  const handleLogoutNow = useCallback(() => {
    setWarningOpen(false)
    logoutForTimeout()
  }, [logoutForTimeout])

  useEffect(() => {
    if (!getAdminToken()) {
      return
    }

    evaluateSession()

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        evaluateSession()
      }
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
      ) {
        evaluateSession()
      }
    }

    const intervalId = window.setInterval(evaluateSession, 1000)
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('storage', onStorage)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [evaluateSession, logoutForTimeout])

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
