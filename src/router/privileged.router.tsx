import type { RouteObject } from 'react-router-dom'
import { lazyWithRetry } from './lazyWithRetry'

const AdminPage = lazyWithRetry(() => import('../modules/admin/pages/AdminPage'), 'admin-page')
const MenuManagementPage = lazyWithRetry(() => import('../modules/setting/menu/pages/MenuManagementPage'), 'menu-management-page')
const CountryPage = lazyWithRetry(() => import('../modules/setting/region/pages/CountryPage'), 'country-page')

export const privilegedRouterItems: RouteObject[] = [
  { path: '/admin', element: <AdminPage /> },
  { path: '/setting/menu', element: <MenuManagementPage /> },
  { path: '/setting/region/country', element: <CountryPage /> },
]
