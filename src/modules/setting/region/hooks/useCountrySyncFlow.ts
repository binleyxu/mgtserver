import { useEffect, useRef, useState } from 'react'

import { COUNTRY_SYNC_TIMEOUT_SECONDS } from '../../../../config'
import type { CountrySyncSummary } from '../types/country.types'
import { requestCancelLatestCountrySync, triggerCountrySync } from '../services/countryService'

export type CountrySyncModalMode = 'confirm' | 'running' | 'result'

interface UseCountrySyncFlowOptions {
  onSyncSuccess: () => Promise<void>
}

export function useCountrySyncFlow(options: UseCountrySyncFlowOptions) {
  const [syncing, setSyncing] = useState(false)
  const [syncModalOpen, setSyncModalOpen] = useState(false)
  const [syncModalMode, setSyncModalMode] = useState<CountrySyncModalMode>('confirm')
  const [syncCountdown, setSyncCountdown] = useState(COUNTRY_SYNC_TIMEOUT_SECONDS)
  const [syncResult, setSyncResult] = useState<CountrySyncSummary | null>(null)
  const [syncResultError, setSyncResultError] = useState<string | null>(null)

  const syncTimerRef = useRef<number | null>(null)
  const syncCountdownRef = useRef(COUNTRY_SYNC_TIMEOUT_SECONDS)
  const syncAbortRef = useRef<AbortController | null>(null)
  const timeoutTriggeredRef = useRef(false)

  const clearSyncTimer = () => {
    if (syncTimerRef.current !== null) {
      window.clearInterval(syncTimerRef.current)
      syncTimerRef.current = null
    }
  }

  const openSyncModal = () => {
    setSyncResult(null)
    setSyncResultError(null)
    syncCountdownRef.current = COUNTRY_SYNC_TIMEOUT_SECONDS
    setSyncCountdown(COUNTRY_SYNC_TIMEOUT_SECONDS)
    setSyncModalMode('confirm')
    setSyncModalOpen(true)
  }

  const closeSyncModal = () => {
    if (syncModalMode === 'running') {
      return
    }

    setSyncModalOpen(false)
    setSyncModalMode('confirm')
    setSyncResult(null)
    setSyncResultError(null)
  }

  const forceTimeoutCancel = async () => {
    if (timeoutTriggeredRef.current || !syncAbortRef.current) {
      return
    }

    timeoutTriggeredRef.current = true
    syncAbortRef.current.abort()
    clearSyncTimer()
    await requestCancelLatestCountrySync({ suppressError: true })
  }

  const startSync = async () => {
    setSyncing(true)
    setSyncModalMode('running')
    setSyncResult(null)
    setSyncResultError(null)
    syncCountdownRef.current = COUNTRY_SYNC_TIMEOUT_SECONDS
    setSyncCountdown(COUNTRY_SYNC_TIMEOUT_SECONDS)
    timeoutTriggeredRef.current = false
    syncAbortRef.current = new AbortController()

    clearSyncTimer()
    syncTimerRef.current = window.setInterval(() => {
      const next = Math.max(0, syncCountdownRef.current - 1)
      syncCountdownRef.current = next

      if (next === 0) {
        setSyncCountdown(0)
        void forceTimeoutCancel()
        return
      }

      if (next <= 10 || next % 5 === 0) {
        setSyncCountdown(next)
      }
    }, 1000)

    try {
      const response = await triggerCountrySync(syncAbortRef.current.signal)
      await options.onSyncSuccess()
      setSyncResult(response.data)
      setSyncResultError(null)
      setSyncModalMode('result')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError' && timeoutTriggeredRef.current) {
        setSyncResult(null)
        setSyncResultError(`同步超时（${COUNTRY_SYNC_TIMEOUT_SECONDS}秒），已自动取消并回滚到同步前数据。`)
        setSyncModalMode('result')
      } else if (error instanceof DOMException && error.name === 'AbortError') {
        setSyncResult(null)
        setSyncResultError('同步已取消并回滚到同步前数据。')
        setSyncModalMode('result')
      } else {
        const message = error instanceof Error ? error.message : '同步失败'
        setSyncResult(null)
        setSyncResultError(message)
        setSyncModalMode('result')
      }
    } finally {
      clearSyncTimer()
      syncAbortRef.current = null
      setSyncing(false)
    }
  }

  useEffect(() => {
    return () => {
      clearSyncTimer()
      syncAbortRef.current?.abort()
      syncAbortRef.current = null
    }
  }, [])

  return {
    syncing,
    syncModalOpen,
    syncModalMode,
    syncCountdown,
    syncResult,
    syncResultError,
    openSyncModal,
    closeSyncModal,
    startSync,
    isSyncRunning: syncModalOpen && syncModalMode === 'running',
  }
}
