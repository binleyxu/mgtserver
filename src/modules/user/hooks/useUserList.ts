import { useEffect, useState } from 'react'

import { getUserList } from '../services/userService'
import type { UserProfile } from '../types/user.types'

export function useUserList() {
  const [userList, setUserList] = useState<UserProfile[]>([])
  const [source, setSource] = useState<'admin' | 'legacy' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await getUserList()
        if (mounted) {
          setUserList(result.data || [])
          setSource(result.source)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : '加载用户失败')
          setSource(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [])

  return { userList, source, loading, error }
}
