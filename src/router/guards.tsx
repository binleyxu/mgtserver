import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { ROLE_USER, getAdminRoleFromToken } from '@/auth'

export function RequirePrivilegedRouter() {
  const location = useLocation()
  const role = getAdminRoleFromToken()

  if (role === ROLE_USER) {
    return <Navigate to="/index" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
