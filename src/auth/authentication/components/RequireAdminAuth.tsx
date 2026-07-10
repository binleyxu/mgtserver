import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { getAdminToken } from '../services/sessionService'

export function RequireAdminAuth() {
  const location = useLocation()
  const token = getAdminToken()

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export default RequireAdminAuth
