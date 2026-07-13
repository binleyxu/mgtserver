import { useEffect, useMemo, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Spin } from 'antd'

import {
  ROLE_USER,
  clearAdminToken,
  getAdminDisplayName,
  getAdminIdFromToken,
  getAdminRoleFromToken,
  getAdminUsernameFromToken,
} from '@/auth'
import { MAINTENANCE_WHITELIST } from '@/config'
import { getSystemSettingProfile } from '@/modules/setting/system-setting/services/systemSettingService'

export function RequirePrivilegedRouter() {
  const location = useLocation()
  const role = getAdminRoleFromToken()

  if (role === ROLE_USER) {
    return <Navigate to="/index" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

type MaintenanceState = {
  loading: boolean
  enabled: boolean
  allowed: boolean
}

function normalizeAccount(value: string): string {
  return value.trim().toLowerCase()
}

const MAINTENANCE_WHITELIST_SET = new Set(MAINTENANCE_WHITELIST.map((item: string) => normalizeAccount(item)))

function isCurrentAdminWhitelisted(): boolean {
  const adminId = getAdminIdFromToken()
  const adminUsername = getAdminUsernameFromToken()
  const cachedDisplayName = getAdminDisplayName()

  if (adminId && MAINTENANCE_WHITELIST_SET.has(normalizeAccount(adminId))) {
    return true
  }

  if (adminUsername && MAINTENANCE_WHITELIST_SET.has(normalizeAccount(adminUsername))) {
    return true
  }

  if (cachedDisplayName && MAINTENANCE_WHITELIST_SET.has(normalizeAccount(cachedDisplayName))) {
    return true
  }

  return false
}

export function RequireMaintenanceAccess() {
  const location = useLocation()
  const [state, setState] = useState<MaintenanceState>({
    loading: true,
    enabled: false,
    allowed: true,
  })

  const isBlocked = useMemo(() => state.enabled && !state.allowed, [state.enabled, state.allowed])

  useEffect(() => {
    let mounted = true

    const syncMaintenanceState = async () => {
      try {
        const response = await getSystemSettingProfile()
        if (!mounted) {
          return
        }

        setState({
          loading: false,
          enabled: response.data.maintenanceMode,
          allowed: response.data.maintenanceMode ? isCurrentAdminWhitelisted() : true,
        })
      } catch {
        if (!mounted) {
          return
        }

        // Fail-open when settings API is unavailable to avoid accidental lockout.
        setState({
          loading: false,
          enabled: false,
          allowed: true,
        })
      }
    }

    void syncMaintenanceState()
    const intervalId = window.setInterval(() => {
      void syncMaintenanceState()
    }, 30000)

    return () => {
      mounted = false
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    if (!isBlocked) {
      return
    }

    clearAdminToken()
  }, [isBlocked])

  if (state.loading) {
    return (
      <div className="app-loading">
        <Spin size="large" tip="系统状态检测中..." />
      </div>
    )
  }

  if (isBlocked) {
    return <Navigate to="/login" replace state={{ from: location.pathname, maintenance: true }} />
  }

  return <Outlet />
}
