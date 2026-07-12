import { lazy } from 'react'
import type { ComponentType, LazyExoticComponent } from 'react'
import { recordClientDiagnostic } from '@/utils/clientDiagnostics'

type ModuleWithDefault<T extends ComponentType<any>> = { default: T }

function fallbackModule(message: string): ModuleWithDefault<ComponentType> {
  const Fallback = () => (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, color: '#2a3a47' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>页面加载失败</div>
        <div style={{ marginBottom: 12 }}>{message}</div>
        <button type="button" onClick={() => window.location.reload()}>刷新重试</button>
      </div>
    </div>
  )

  return { default: Fallback }
}

export function lazyWithRetry<T extends ComponentType<any>>(
  importer: () => Promise<ModuleWithDefault<T>>,
  key: string
): LazyExoticComponent<T> {
  return lazy(async () => {
    const retryKey = `lazy-retry:${key}`

    try {
      const mod = await importer()
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(retryKey)
      }
      return mod
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown lazy chunk error'

      if (typeof window !== 'undefined') {
        const hasRetried = window.sessionStorage.getItem(retryKey) === '1'
        if (!hasRetried) {
          recordClientDiagnostic('lazy_chunk_retry_reload', {
            key,
            routePath: window.location.pathname,
            href: window.location.href,
            message,
          })
          window.sessionStorage.setItem(retryKey, '1')
          window.location.reload()
          return new Promise<ModuleWithDefault<T>>(() => {})
        }
        window.sessionStorage.removeItem(retryKey)

        recordClientDiagnostic('lazy_chunk_retry_failed', {
          key,
          routePath: window.location.pathname,
          href: window.location.href,
          message,
        })
      }

      return fallbackModule(message) as ModuleWithDefault<T>
    }
  })
}
