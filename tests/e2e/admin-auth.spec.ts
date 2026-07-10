import { test, expect } from '@playwright/test'
import { fulfillJson } from './fixtures/apiContractFixtures'

test.describe('Admin Auth Guard', () => {
  test('should redirect to login when admin list returns 401', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('admin_token', 'mock-admin-token')
    })

    await page.route('**/api/admin/list**', async (route) => {
      await fulfillJson(route, { message: 'unauthorized' }, 401)
    })

    await page.route('**/api/admin/roles/list', async (route) => {
      await fulfillJson(route, { message: 'unauthorized' }, 401)
    })

    await page.goto('/admin')

    await expect(page).toHaveURL(/\/login$/)
  })
})
