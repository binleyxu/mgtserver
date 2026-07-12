import { Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'

import { HomeRouterPage } from './home.router'
import { lazyWithRetry } from './lazyWithRetry'

const IndexPage = lazyWithRetry(() => import('../modules/index/pages/IndexPage'), 'index-page')
const UserHomePage = lazyWithRetry(() => import('../modules/user/pages/UserHomePage'), 'user-home-page')

export const protectedRouterItems: RouteObject[] = [
  { path: '/', element: <Navigate to="/index" replace /> },
  { path: '/home', element: <HomeRouterPage /> },
  { path: '/index', element: <IndexPage /> },
  { path: '/user', element: <UserHomePage /> },
]
