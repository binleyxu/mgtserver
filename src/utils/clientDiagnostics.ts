import { API_ENDPOINTS } from '@/config'

type ClientDiagnosticEventType =
  | 'lazy_chunk_retry_reload'
  | 'lazy_chunk_retry_failed'

type ClientDiagnosticPayload = {
  key: string
  routePath: string
  href: string
  message: string
}

type ClientDiagnosticEntry = {
  type: ClientDiagnosticEventType
  ts: string
  payload: ClientDiagnosticPayload
}

const CLIENT_DIAGNOSTIC_STORAGE_KEY = 'client_diagnostics_v1'
const CLIENT_DIAGNOSTIC_MAX_ITEMS = 50

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function readClientDiagnostics(): ClientDiagnosticEntry[] {
  if (!isBrowser()) {
    return []
  }

  try {
    const raw = window.sessionStorage.getItem(CLIENT_DIAGNOSTIC_STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as ClientDiagnosticEntry[]) : []
  } catch {
    return []
  }
}

function writeClientDiagnostics(entries: ClientDiagnosticEntry[]): void {
  if (!isBrowser()) {
    return
  }

  try {
    window.sessionStorage.setItem(CLIENT_DIAGNOSTIC_STORAGE_KEY, JSON.stringify(entries.slice(-CLIENT_DIAGNOSTIC_MAX_ITEMS)))
  } catch {
    // Ignore storage write errors.
  }
}

function reportClientDiagnostic(entry: ClientDiagnosticEntry): void {
  if (!isBrowser()) {
    return
  }

  const body = JSON.stringify({
    ...entry,
    userAgent: navigator.userAgent,
    pathname: window.location.pathname,
  })

  try {
    if (typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' })
      const accepted = navigator.sendBeacon(API_ENDPOINTS.CLIENT.DIAGNOSTIC_LOG, blob)
      if (accepted) {
        return
      }
    }
  } catch {
    // Fall back to keepalive fetch.
  }

  void fetch(API_ENDPOINTS.CLIENT.DIAGNOSTIC_LOG, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    keepalive: true,
    body,
  }).catch(() => {
    // Best-effort diagnostics should never impact user flow.
  })
}

export function recordClientDiagnostic(type: ClientDiagnosticEventType, payload: ClientDiagnosticPayload): void {
  const entry: ClientDiagnosticEntry = {
    type,
    ts: new Date().toISOString(),
    payload,
  }

  if (isBrowser()) {
    const current = readClientDiagnostics()
    current.push(entry)
    writeClientDiagnostics(current)
  }

  // Keep a visible trace in browser console for quick troubleshooting.
  console.warn('[ClientDiagnostics]', entry)

  reportClientDiagnostic(entry)
}

export function getClientDiagnosticsSnapshot(): ClientDiagnosticEntry[] {
  return readClientDiagnostics()
}
