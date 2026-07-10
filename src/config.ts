/**
 * 应用全局配置
 */

// API 服务基础 URL
// 默认使用相对 /api，方便本地开发和 preview 通过 Vite 代理转发。
// 生产环境可通过 VITE_API_BASE_URL 覆盖。
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

// UI display timezone. Defaults to Australia/Sydney for ops consistency.
export const DISPLAY_TIME_ZONE = import.meta.env.VITE_DISPLAY_TIME_ZONE ?? 'Australia/Sydney'

const DEFAULT_COUNTRY_SYNC_TIMEOUT_SECONDS = 300
const parsedCountrySyncTimeoutSeconds = Number.parseInt(import.meta.env.VITE_COUNTRY_SYNC_TIMEOUT_SECONDS ?? '', 10)

export const COUNTRY_SYNC_TIMEOUT_SECONDS =
	Number.isFinite(parsedCountrySyncTimeoutSeconds) && parsedCountrySyncTimeoutSeconds > 0
		? parsedCountrySyncTimeoutSeconds
		: DEFAULT_COUNTRY_SYNC_TIMEOUT_SECONDS

function withApiBase(path: string): string {
	return `${API_BASE_URL}${path}`
}

export const API_ENDPOINTS = {
	AUTH: {
		LOGIN: withApiBase('/login'),
		CHALLENGE: withApiBase('/auth/challenge'),
		MENU: withApiBase('/auth/menu'),
	},
	ADMIN: {
		LIST: withApiBase('/admin/list'),
		DETAIL: (id: string) => withApiBase(`/admin/${id}`),
		CREATE: withApiBase('/admin'),
		UPDATE: (id: string) => withApiBase(`/admin/${id}`),
		DELETE: (id: string) => withApiBase(`/admin/${id}`),
		ROLE_LIST: withApiBase('/admin/roles/list'),
		ROLE_CREATE: withApiBase('/admin/roles'),
		ROLE_UPDATE: (roleId: number) => withApiBase(`/admin/roles/${roleId}`),
		ROLE_DELETE: (roleId: number) => withApiBase(`/admin/roles/${roleId}`),
	},
	MENU: {
		LIST: withApiBase('/menu/list'),
		CREATE: withApiBase('/menu'),
		UPDATE: (menuId: number) => withApiBase(`/menu/${menuId}`),
		ROLE_MENU: (roleId: number) => withApiBase(`/menu/roles/${roleId}`),
	},
	USER: {
		LIST_ADMIN: withApiBase('/admin/user/list?page=1&pageSize=1000'),
		LIST_LEGACY: withApiBase('/user/list'),
	},
	REGION: {
		COUNTRY_LIST: withApiBase('/region/country'),
		COUNTRY_SYNC: withApiBase('/region/country/sync'),
		COUNTRY_SYNC_CANCEL_LATEST: withApiBase('/region/country/sync/cancel-latest'),
		COUNTRY_SYNC_RUNS: withApiBase('/region/country/sync-runs'),
		COUNTRY_DISPLAY_NAME_UPDATE: (countryId: number) => withApiBase(`/region/country/${countryId}/display-name`),
	},
} as const
