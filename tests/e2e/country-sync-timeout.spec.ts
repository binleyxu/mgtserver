import { test, expect } from '@playwright/test'
import { contractFixtures, fulfillJson } from './fixtures/apiContractFixtures'

test.describe('Country Sync Timeout', () => {
  test('should show timeout failure result when countdown reaches zero', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('admin_token', 'mock-admin-token')

      const originalSetInterval = window.setInterval.bind(window)
      window.setInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
        const acceleratedTimeout = typeof timeout === 'number' ? Math.min(timeout, 10) : 10
        return originalSetInterval(handler, acceleratedTimeout, ...args)
      }) as typeof window.setInterval
    })

    await page.route('**/api/region/country', async (route) => {
      if (route.request().method() === 'GET') {
        await fulfillJson(route, contractFixtures.countryListEmpty())
        return
      }

      await route.fallback()
    })

    await page.route('**/api/region/country/sync', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 10_000))
      await fulfillJson(route, contractFixtures.countrySyncSummary(1, 0, 0, 0))
    })

    await page.route('**/api/region/country/sync/cancel-latest', async (route) => {
      await fulfillJson(route, contractFixtures.cancelLatestSuccess())
    })

    await page.goto('/setting/region/country')

    await page.getByRole('button', { name: '同步公网国家数据' }).click()
    await page.getByRole('button', { name: '确认同步' }).click()

    await expect(page.getByText('正在同步公网数据，请稍候...')).toBeVisible()
    await expect(page.getByText('同步超时（300秒），已自动取消并回滚到同步前数据。')).toBeVisible()
    await expect(page.getByRole('button', { name: '知道了' })).toBeVisible()
  })
})
