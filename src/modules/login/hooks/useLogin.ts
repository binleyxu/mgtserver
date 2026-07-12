import { useState } from 'react'
import { getAdminDetail } from '../../admin'
import { clearAdminToken, getAdminIdFromToken, loginAdmin, setAdminDisplayProfile, setAdminToken } from '@/auth'
import type { AdminLoginRequest, AdminLoginResponse } from '@/auth'

type AdminStatus = 'active' | 'inactive' | null
const ADMIN_STATUS_CHECK_TIMEOUT_MS = 5000

async function resolveAdminStatus(token: string): Promise<AdminStatus> {
  const adminId = getAdminIdFromToken(token)

  if (!adminId) {
    return null
  }

  try {
    const detail = await getAdminDetail(adminId)
    return detail.data?.status ?? null
  } catch (err) {
    console.warn('[Login] getAdminDetail failed, skip admin status check:', err)
    return null
  }
}

async function resolveAdminStatusWithTimeout(token: string): Promise<AdminStatus> {
  return await Promise.race<AdminStatus>([
    resolveAdminStatus(token),
    new Promise<AdminStatus>((resolve) => {
      globalThis.setTimeout(() => resolve(null), ADMIN_STATUS_CHECK_TIMEOUT_MS)
    }),
  ])
}

export function useLogin() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function login(data: AdminLoginRequest): Promise<AdminLoginResponse> {
    setLoading(true)
    setError(null)

    try {
      if (!data.human_token) {
        throw new Error('请先完成“我不是机器人”验证')
      }

      const response = await loginAdmin(data)
      if (response.success && response.access_token) {
        setAdminToken(response.access_token, {
          expires_at: response.expires_at,
          expires_in: response.expires_in,
          warning_before_seconds: response.warning_before_seconds,
          server_time: response.server_time,
        })
        setAdminDisplayProfile(data.username)

        const adminStatus = await resolveAdminStatusWithTimeout(response.access_token)

        if (adminStatus === 'inactive') {
          clearAdminToken()
          throw new Error('该账号已被禁用，无法登录')
        }
      }
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录请求失败'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    login,
    loading,
    error,
    setError,
  }
}
