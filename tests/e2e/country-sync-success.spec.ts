import { test, expect } from '@playwright/test'
import { contractFixtures, fulfillJson } from './fixtures/apiContractFixtures'

test.describe('Country Sync Success', () => {
  test('should show sync result before timeout when backend returns quickly', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('admin_token', 'mock-admin-token')
    })

    await page.route('**/api/region/country', async (route) => {
      if (route.request().method() === 'GET') {
        await fulfillJson(route, contractFixtures.countryListEmpty())
        return
      }

      await route.fallback()
    })

    await page.route('**/api/region/country/sync', async (route) => {
      await fulfillJson(route, contractFixtures.countrySyncSummary(3, 5, 7, 1))
    })

    await page.goto('/setting/region/country')

    await page.getByRole('button', { name: '同步公网国家数据' }).click()
    await page.getByRole('button', { name: '确认同步' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('同步完成')).toBeVisible()
    await expect(dialog.getByText('新增')).toBeVisible()
    await expect(dialog.getByText('3条')).toBeVisible()
    await expect(dialog.getByText('更新')).toBeVisible()
    await expect(dialog.getByText('5条')).toBeVisible()
    await expect(dialog.getByText('未变化')).toBeVisible()
    await expect(dialog.getByText('7条')).toBeVisible()
    await expect(dialog.getByText('移除')).toBeVisible()
    await expect(dialog.getByText('1条')).toBeVisible()
    await expect(dialog.getByRole('button', { name: '知道了' })).toBeVisible()
    await expect(dialog.getByText('同步超时')).toHaveCount(0)
  })
})
