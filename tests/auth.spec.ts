import { test, expect } from '@playwright/test'

const UI_URL = 'http://localhost:3000'

test.describe('Authentication Flow', () => {
  const uniqueEmail = `testuser_${Date.now()}@example.com`
  const password = 'Password123!'

  test('should allow a user to sign up (onboarding starts)', async ({ page }) => {
    await page.goto(`${UI_URL}/sign-up`)

    // Current app uses firstName/lastName instead of name
    const firstName = page.locator('input[name="firstName"], [data-testid="first-name"]')
    const lastName = page.locator('input[name="lastName"], [data-testid="last-name"]')
    await firstName.fill('Test')
    await lastName.fill('User')
    await page.fill('input[name="email"]', uniqueEmail)
    await page.fill('input[name="password"]', password)
    await page.click('button[type="submit"]')

    // Expect onboarding route or banner
    await page.waitForLoadState('networkidle')
    await expect(
      page.locator('url=/auth/onboarding').or(page.locator('[data-testid="verification-banner"], text=Onboarding'))
    ).toBeTruthy()
  })

  test('should allow a logged-in user to sign out', async ({ page }) => {
    const email = `test_signout_${Date.now()}@example.com`
    await page.goto(`${UI_URL}/sign-up`)
    await page.locator('input[name="firstName"], [data-testid="first-name"]').fill('SignOut')
    await page.locator('input[name="lastName"], [data-testid="last-name"]').fill('Test')
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', password)
    await page.click('button[type="submit"]')

    // Navigate to home to find header easily (if needed)
    await page.goto(UI_URL)

    // Open user menu via a stable affordance (avatar/menu button)
    // Try a few common selectors
    const userMenuButton = page.locator('[data-testid="user-menu"], [aria-label*="account" i], [aria-haspopup="menu"]').first()
    await userMenuButton.click()
    await page.getByRole('menuitem', { name: /sign out/i }).click()
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
  })

  test('should allow an existing user to sign in', async ({ page }) => {
    // Create user first via sign-up
    await page.goto(`${UI_URL}/sign-up`)
    await page.locator('input[name="firstName"], [data-testid="first-name"]').fill('SignIn')
    await page.locator('input[name="lastName"], [data-testid="last-name"]').fill('Test')
    await page.fill('input[name="email"]', uniqueEmail)
    await page.fill('input[name="password"]', password)
    await page.click('button[type="submit"]')

    // Sign out
    await page.goto(UI_URL)
    const userMenuButton = page.locator('[data-testid="user-menu"], [aria-label*="account" i], [aria-haspopup="menu"]').first()
    await userMenuButton.click()
    await page.getByRole('menuitem', { name: /sign out/i }).click()

    // Sign in
    await page.goto(`${UI_URL}/sign-in`)
    await page.fill('input[name="email"]', uniqueEmail)
    await page.fill('input[name="password"]', password)
    await page.click('button[type="submit"]')

    // Expect to be logged in (header user menu visible)
    await page.goto(UI_URL)
    await expect(page.locator('[data-testid="user-menu"], [aria-haspopup="menu"]').first()).toBeVisible()
  })
})
