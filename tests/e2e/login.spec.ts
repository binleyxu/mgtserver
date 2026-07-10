import { test, expect } from '@playwright/test'
import { contractFixtures, fulfillJson } from './fixtures/apiContractFixtures'

test.describe('Login Page Human Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/auth/challenge', async (route) => {
      await fulfillJson(route, contractFixtures.humanChallenge())
    })
    await page.route('**/api/auth/challenge', async (route) => {
      await fulfillJson(route, contractFixtures.humanChallenge())
    })
    await page.goto('/login')
  })

  test('should render login form and block login until human verification succeeds', async ({ page }) => {
    await expect(page.getByLabel('用户名')).toBeVisible()
    await expect(page.getByLabel('密码')).toBeVisible()
    const loginButton = page.getByRole('button', { name: /^登录/ })
    await expect(loginButton).toBeDisabled()
  })

  test('should enable login after human verification challenge succeeds', async ({ page }) => {
    const checkbox = page.getByRole('checkbox', { name: '我不是机器人' })
    await expect(checkbox).toBeVisible()
    await checkbox.check()
    const loginButton = page.getByRole('button', { name: /^登录/ })
    await expect(loginButton).toBeEnabled()
    await expect(page.locator('text=挑战剩余时间')).toBeVisible()
  })

  test('should reject login when admin account is inactive', async ({ page }) => {
    await page.route('**/api/login', async (route) => {
      await fulfillJson(route, contractFixtures.loginSuccess())
    })

    await page.route('**/api/admin/list**', async (route) => {
      await fulfillJson(route, contractFixtures.adminListInactive('inactive-admin'))
    })

    await page.getByRole('checkbox', { name: '我不是机器人' }).check()
    await page.getByLabel('用户名').fill('inactive-admin')
    await page.getByLabel('密码').fill('secret')
    await page.getByRole('button', { name: /^登录/ }).click()

    await expect(page.locator('.ant-message')).toContainText('该账号已被禁用，无法登录')
    await expect(page).toHaveURL(/\/login$/)

    const storedToken = await page.evaluate(() => window.localStorage.getItem('admin_token'))
    expect(storedToken).toBeNull()
  })
})
