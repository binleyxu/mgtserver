import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const LoginPage = lazy(() => import('../modules/login/pages/LoginPage'))

export const publicRouterItems: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
]
