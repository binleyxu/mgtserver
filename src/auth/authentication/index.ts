export { RequireAdminAuth } from './components/RequireAdminAuth'
export { SessionTimeoutManager } from './components/SessionTimeoutManager'

export type {
  AdminLoginRequest,
  AdminLoginResponse,
  ApiResponse,
} from './types/auth.types'

export {
  loginAdmin,
  refreshAdminSession,
  setAdminToken,
  clearAdminToken,
  getHumanChallenge,
  ApiHttpError,
} from './services/authService'

export {
  buildAdminSessionRefreshSnapshot,
  clearAdminSessionActivityEvents,
  getAdminToken,
  getAdminIdFromToken,
  getAdminRoleFromToken,
  getAdminUsernameFromToken,
  getAdminSessionActivityEvents,
  recordAdminSessionActivityEvent,
  getAdminDisplayName,
  getAdminDisplayAvatarUrl,
  setAdminDisplayProfile,
  buildAuthHeaders,
  handleUnauthorizedResponse,
} from './services/sessionService'
