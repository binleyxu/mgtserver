import { test, expect } from '@playwright/test'
import { contractFixtures, fulfillJson } from './fixtures/apiContractFixtures'

test.describe('Menu Management Envelope Compatibility', () => {
  test('should render menu rows when backend returns envelope data.items', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('admin_token', 'mock-admin-token')
    })

    await page.route('**/api/menu/list', async (route) => {
      await fulfillJson(route, contractFixtures.menuListEnvelope())
    })

    await page.goto('/setting/menu')

    await expect(page.getByRole('heading', { name: '管理后台' })).toBeVisible()
    await expect(page.getByText('菜单管理', { exact: true }).first()).toBeVisible()
    await expect(page.getByRole('cell', { name: 'setting.menu' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'setting.region.country' })).toBeVisible()
  })

  test('should show error message when menu list returns business failure code', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('admin_token', 'mock-admin-token')
    })

    await page.route('**/api/menu/list', async (route) => {
      await fulfillJson(route, {
        code: 5001,
        message: '菜单读取失败',
      })
    })

    await page.goto('/setting/menu')

    await expect(page.locator('.ant-message')).toContainText('菜单读取失败')
    await expect(page.getByRole('cell', { name: 'setting.menu' })).toHaveCount(0)
  })
})
