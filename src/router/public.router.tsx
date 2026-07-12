import type { RouteObject } from 'react-router-dom'
import { lazyWithRetry } from './lazyWithRetry'

const LoginPage = lazyWithRetry(() => import('../modules/login/pages/LoginPage'), 'login-page')

export const publicRouterItems: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
]
