import { test, expect } from '@playwright/test'
import { fulfillJson } from './fixtures/apiContractFixtures'

test.describe('Session Timeout Continue Flow', () => {
  test('should stay on protected page after clicking continue session while refresh is pending', async ({ page }) => {
    await page.addInitScript(() => {
      const nowSeconds = Math.floor(Date.now() / 1000)
      window.localStorage.setItem('admin_token', 'mock-admin-token')
      window.localStorage.setItem('admin_session_expires_at', String(nowSeconds + 120))
      window.localStorage.setItem('admin_session_warning_before_seconds', '300')
      window.localStorage.removeItem('admin_session_server_offset_seconds')
    })

    await page.route('**/api/auth/refresh', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1600))

      const nowSeconds = Math.floor(Date.now() / 1000)
      await fulfillJson(route, {
        code: 0,
        message: 'ok',
        access_token: 'refreshed-admin-token',
        token_type: 'bearer',
        expires_at: nowSeconds + 120,
        warning_before_seconds: 30,
        server_time: nowSeconds,
      })
    })

    await page.goto('/index')
    await expect(page).toHaveURL(/\/index$/)

    await page.evaluate(() => {
      const nowSeconds = Math.floor(Date.now() / 1000)
      window.localStorage.setItem('admin_session_expires_at', String(nowSeconds + 2))
      window.localStorage.setItem('admin_session_warning_before_seconds', '300')
    })

    await expect(page.getByText('会话即将过期')).toBeVisible()
    await page.getByRole('button', { name: '继续会话' }).click()

    await page.waitForTimeout(1200)
    await expect(page).not.toHaveURL(/\/login$/)

    await expect(page).toHaveURL(/\/index$/)
    await expect(page.getByText('会话即将过期')).toBeHidden()

    const storedToken = await page.evaluate(() => window.localStorage.getItem('admin_token'))
    expect(storedToken).toBe('refreshed-admin-token')
  })
})
