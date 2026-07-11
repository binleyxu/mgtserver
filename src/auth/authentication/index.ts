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
  getAdminToken,
  getAdminIdFromToken,
  getAdminRoleFromToken,
  buildAuthHeaders,
  handleUnauthorizedResponse,
} from './services/sessionService'
