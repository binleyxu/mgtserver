import type { Route } from '@playwright/test'

export async function fulfillJson(route: Route, payload: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  })
}

export const contractFixtures = {
  humanChallenge() {
    return { id: 'mock-challenge-id', expires_in: 60 }
  },

  loginSuccess() {
    return {
      code: 0,
      message: '登录成功',
      access_token: 'mock-token-without-sub',
      token_type: 'bearer',
    }
  },

  adminListInactive(username: string) {
    return {
      code: 0,
      data: [
        {
          id: 'admin-1',
          username,
          full_name: 'Inactive Admin',
          email: 'inactive@example.com',
          role: 'admin',
          role_id: 2,
          is_active: false,
          created_at: '2026-07-11T00:00:00Z',
          last_login: '2026-07-11T00:00:00Z',
        },
      ],
      total: 1,
    }
  },

  userListFromAdmin() {
    return {
      code: 0,
      message: 'ok',
      data: {
        items: [
          {
            id: 101,
            uuid: 'u-101',
            username: 'alice',
            nickname: 'Alice',
            phone: '13800138000',
            register_source: 'app',
            status: 'active',
          },
        ],
        total: 1,
      },
    }
  },

  userListFromLegacy() {
    return {
      code: 0,
      message: 'ok',
      data: [
        {
          id: 202,
          uuid: 'u-202',
          username: 'bob',
          nickname: 'Bob',
          phone: null,
          register_source: 'web',
          status: 'inactive',
        },
      ],
      total: 1,
    }
  },

  countryListEmpty() {
    return { code: 0, data: [] }
  },

  countrySyncSummary(inserted: number, updated: number, unchanged: number, removed: number) {
    return {
      code: 0,
      data: { inserted, updated, unchanged, removed },
    }
  },

  cancelLatestSuccess() {
    return { code: 0, data: { cancelled: true } }
  },

  menuListEnvelope() {
    return {
      code: 0,
      data: {
        total: 2,
        items: [
          {
            id: 101,
            menu_key: 'setting.menu',
            label: '菜单管理',
            path: '/setting/menu',
            parent_id: null,
            sort: 1,
            is_active: true,
          },
          {
            id: 102,
            menu_key: 'setting.region.country',
            label: '国家',
            path: '/setting/region/country',
            parent_id: 101,
            sort: 2,
            is_active: true,
          },
        ],
      },
    }
  },
}
