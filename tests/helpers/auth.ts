import { Page, expect } from '@playwright/test'

export const TEST_ADMIN_CREDENTIALS = {
  email: process.env.TEST_ADMIN_EMAIL || 'test.admin+e2e@test.local',
  password: process.env.TEST_ADMIN_PASSWORD || 'TestAdmin123!'
}

export async function loginAsAdmin(page: Page) {
  await page.goto('/sign-in')

  await page.getByLabel('Email').fill(TEST_ADMIN_CREDENTIALS.email)
  await page.getByLabel('Password').fill(TEST_ADMIN_CREDENTIALS.password)
  await page.getByRole('button', { name: 'Sign In' }).click()

  await page.waitForURL('**/admin/dashboard', { timeout: 15000 })
  await expect(page).toHaveURL(/\/admin\/dashboard$/)
  await expect(page.getByRole('heading', { name: /Admin Dashboard/i })).toBeVisible({ timeout: 10000 })
}

export async function ensureSignedOut(page: Page) {
  try {
    await page.goto('/')
    const userMenuButton = page
      .locator('[data-testid="user-menu"], [aria-label*="account" i], [aria-haspopup="menu"]').first()
    await userMenuButton.click({ timeout: 3000 })
    await page.getByRole('menuitem', { name: /sign out/i }).click({ timeout: 3000 })
    await page.waitForLoadState('networkidle')
  } catch {
    // already signed out
  }
}
