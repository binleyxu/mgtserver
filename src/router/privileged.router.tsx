import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const AdminPage = lazy(() => import('../modules/admin/pages/AdminPage'))
const MenuManagementPage = lazy(() => import('../modules/setting/menu/pages/MenuManagementPage'))
const CountryPage = lazy(() => import('../modules/setting/region/pages/CountryPage'))

export const privilegedRouterItems: RouteObject[] = [
  { path: '/admin', element: <AdminPage /> },
  { path: '/setting/menu', element: <MenuManagementPage /> },
  { path: '/setting/region/country', element: <CountryPage /> },
]
