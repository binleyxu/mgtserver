import { useEffect, useState } from 'react'

import { getUserList } from '../services/userService'
import type { UserProfile } from '../types/user.types'

export function useUserList() {
  const [userList, setUserList] = useState<UserProfile[]>([])
  const [source, setSource] = useState<'admin' | 'legacy' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await getUserList(page, pageSize)
        if (mounted) {
          setUserList(result.data || [])
          setSource(result.source)
          setTotal(result.total || 0)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : '加载用户失败')
          setSource(null)
          setTotal(0)
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
  }, [page, pageSize])

  return {
    userList,
    source,
    loading,
    error,
    page,
    pageSize,
    total,
    setPage,
    setPageSize,
  }
}
