import { useState } from 'react'
import { getAdminByUsername, getAdminDetail } from '../../admin'
import { clearAdminToken, getAdminIdFromToken, loginAdmin, setAdminToken } from '@/auth'
import type { AdminLoginRequest, AdminLoginResponse } from '@/auth'

type AdminStatus = 'active' | 'inactive' | null

async function resolveAdminStatus(username: string, token: string): Promise<AdminStatus> {
  const adminId = getAdminIdFromToken(token)

  if (adminId) {
    try {
      const detail = await getAdminDetail(adminId)
      return detail.data?.status ?? null
    } catch (err) {
      console.warn('[Login] getAdminDetail failed, fallback to username lookup:', err)
    }
  }

  try {
    const admin = await getAdminByUsername(username)
    return admin?.status ?? null
  } catch (err) {
    console.warn('[Login] getAdminByUsername failed:', err)
    return null
  }
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

        const adminStatus = await resolveAdminStatus(data.username, response.access_token)

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
