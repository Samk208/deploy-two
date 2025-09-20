import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

// Basic E2E checks for Google Translate integration without relying on Google internals.
// We verify that:
// - The hidden widget mount node exists
// - The init function is present after the script loads
// - Our helper functions are available
// - Selecting a language from the header updates the googtrans cookie
// - The header language label updates accordingly
// Note: Traditional Chinese (zh-TW) support removed per requirements

const HOME_URL = '/'

async function openLanguageMenu(page: Page) {
  // The header language button has aria-label="Language settings"
  const btn = page.getByRole('button', { name: 'Language settings' })
  await expect(btn).toBeVisible()
  await btn.click()
}

test.describe('Google Translate integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HOME_URL)
  })

  test('widget mounts and init helpers are available', async ({ page }) => {
    // Element mount exists
    await expect(page.locator('#google_translate_element')).toHaveCount(1)

    // Script should register init function
    await expect.poll(async () => {
      return await page.evaluate(() => typeof (window as any).googleTranslateElementInit === 'function')
    }, { timeout: 15000 }).toBe(true)

    // Helpers from our component
    await expect.poll(async () => {
      return await page.evaluate(() => typeof (window as any).setTranslateLanguage === 'function')
    }, { timeout: 15000 }).toBe(true)

    await expect.poll(async () => {
      return await page.evaluate(() => typeof (window as any).getTranslateLanguage === 'function')
    }, { timeout: 15000 }).toBe(true)
  })

  test('selecting Korean sets cookie and updates header label', async ({ page }) => {
    await openLanguageMenu(page)
    await page.getByRole('menuitem', { name: '한국어 (KO)' }).click()

    // Cookie updated
    await expect.poll(async () => {
      return await page.evaluate(() => {
        const c = document.cookie
        return c.includes('googtrans=/auto/ko') || c.includes('googtrans=/en/ko')
      })
    }, { timeout: 15000 }).toBe(true)

    // Header label shows KO
    const headerBtn = page.getByRole('button', { name: 'Language settings' })
    await expect(headerBtn.getByTestId('lang-label')).toHaveText(/KO|ko/i, { timeout: 15000 })
  })

  test('selecting Simplified Chinese sets cookie and updates header label', async ({ page }) => {
    await openLanguageMenu(page)
    await page.getByRole('menuitem', { name: '中文（简体）' }).click()

    await expect.poll(async () => {
      return await page.evaluate(() => {
        const c = document.cookie
        return c.includes('googtrans=/auto/zh-CN') || c.includes('googtrans=/en/zh-CN')
      })
    }, { timeout: 15000 }).toBe(true)

    const headerBtn = page.getByRole('button', { name: 'Language settings' })
    await expect(headerBtn.getByTestId('lang-label')).toContainText('简体', { timeout: 15000 })
  })
})
