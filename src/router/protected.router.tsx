import { lazy } from 'react'
import { Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'

import { HomeRouterPage } from './home.router'

const IndexPage = lazy(() => import('../modules/index/pages/IndexPage'))
const UserHomePage = lazy(() => import('../modules/user/pages/UserHomePage'))

export const protectedRouterItems: RouteObject[] = [
  { path: '/', element: <Navigate to="/index" replace /> },
  { path: '/home', element: <HomeRouterPage /> },
  { path: '/index', element: <IndexPage /> },
  { path: '/user', element: <UserHomePage /> },
]
