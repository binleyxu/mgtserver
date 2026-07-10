import { test, expect } from '@playwright/test'
import { contractFixtures, fulfillJson } from './fixtures/apiContractFixtures'

test.describe('User List Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('admin_token', 'mock-admin-token')
    })
  })

  test('should render users from admin user list endpoint', async ({ page }) => {
    await page.route('**/api/admin/user/list**', async (route) => {
      await fulfillJson(route, contractFixtures.userListFromAdmin())
    })

    await page.goto('/user')

    await expect(page.getByRole('cell', { name: 'alice', exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Alice', exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'app', exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'active', exact: true })).toBeVisible()
    await expect(page.getByText('Failed to fetch user')).toHaveCount(0)
  })

  test('should fallback to legacy user list endpoint when admin endpoint is 404', async ({ page }) => {
    await page.route('**/api/admin/user/list**', async (route) => {
      await fulfillJson(route, { message: 'not found' }, 404)
    })

    await page.route('**/api/user/list', async (route) => {
      await fulfillJson(route, contractFixtures.userListFromLegacy())
    })

    await page.goto('/user')

    await expect(page.getByRole('cell', { name: 'bob', exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Bob', exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'web', exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'inactive', exact: true })).toBeVisible()
    await expect(page.getByText('Failed to fetch user')).toHaveCount(0)
  })
})
