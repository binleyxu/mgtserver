import { Navigate, useRoutes } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'

import { RequireAdminAuth, SessionTimeoutManager } from '@/auth'
import { RequireMaintenanceAccess, RequirePrivilegedRouter } from './guards'
import { privilegedRouterItems } from './privileged.router'
import { protectedRouterItems } from './protected.router'
import { publicRouterItems } from './public.router'

const appRouterItems: RouteObject[] = [
  ...publicRouterItems,
  {
    element: <RequireAdminAuth />,
    children: [
      {
        element: <SessionTimeoutManager />,
        children: [
          {
            element: <RequireMaintenanceAccess />,
            children: [
              ...protectedRouterItems,
              {
                element: <RequirePrivilegedRouter />,
                children: privilegedRouterItems,
              },
              { path: '*', element: <Navigate to="/index" replace /> },
            ],
          },
        ],
      },
    ],
  },
]

export function AppRouter() {
  return useRoutes(appRouterItems)
}
