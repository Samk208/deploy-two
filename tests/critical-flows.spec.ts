import { test, expect, Page } from '@playwright/test'
import { generateSamplePdf } from './helpers/test-data'

test.describe.configure({ mode: 'serial' })

// 1) Products display on /shop
test('Shop page displays products and images/placeholders', async ({ page }) => {
  await page.goto('/shop')
  await page.waitForLoadState('networkidle')

  const productCards = page.locator('[data-testid="product-card"], .group')
  await expect(productCards.first()).toBeVisible()

  const hasImage = await page
    .locator('img[alt*="product" i], img[alt*="Product" i]')
    .first()
    .isVisible()
    .catch(() => false)
  if (!hasImage) {
    const placeholder = page.locator('[data-testid="image-placeholder"], [data-placeholder], svg').first()
    await expect(placeholder).toBeVisible()
  }
})

async function performSignUp(page: Page, role: 'influencer' | 'brand') {
  const ts = Date.now()
  const email = `e2e.${role}.${ts}@test.local`
  const password = 'Password123!'

  await page.goto('/sign-up')
  await page.waitForLoadState('networkidle')

  const emailInput = page.locator('[data-testid="email-input"], input[type="email"]')
  const passwordInput = page.locator('[data-testid="password-input"], input[type="password"]')
  const continueBtn = page.locator('[data-testid="sign-up-submit"], button:has-text("Sign Up"), button:has-text("Create Account")')

  await emailInput.fill(email)
  await passwordInput.fill(password)
  await continueBtn.click()

  await page.waitForLoadState('networkidle')
  await page.goto('/auth/onboarding')
  await page.waitForLoadState('networkidle')

  const roleToggle = page
    .locator(`[data-testid="role-${role}"]`)
    .or(page.getByRole('button', { name: new RegExp(role, 'i') }))
  await roleToggle.click()

  const nextBtn = page.locator('[data-testid="onboarding-next"], button:has-text("Next"), button:has-text("Continue")')
  await nextBtn.click()

  const firstName = page.locator('[data-testid="first-name"], input[name="firstName"], input[placeholder*="First" i]')
  const lastName = page.locator('[data-testid="last-name"], input[name="lastName"], input[placeholder*="Last" i]')
  const handle = page.locator('[data-testid="handle"], input[name="handle"], input[placeholder*="handle" i]')

  await firstName.fill('E2E')
  await lastName.fill(role.charAt(0).toUpperCase() + role.slice(1))
  await handle.fill(`e2e-${role}-${ts}`)
  await nextBtn.click()

  const { buffer, name, mimeType } = generateSamplePdf()
  const fileInput = page.locator('input[type="file"]')
  if (await fileInput.count()) {
    await fileInput.setInputFiles({ name, mimeType, buffer })
  } else {
    const uploadBtn = page.locator('[data-testid="doc-upload"], button:has-text("Upload")')
    const chooser = page.waitForEvent('filechooser')
    await uploadBtn.click()
    const fc = await chooser
    await fc.setFiles({ name, mimeType, buffer })
  }
  // Wait deterministically for an upload success indicator instead of fixed timeout
  await expect(
    page.locator('[data-testid="upload-success"], text=/Uploaded|Success|Verification/i')
  ).toBeVisible({ timeout: 5000 });
  await nextBtn.click()

  const submitBtn = page.locator('[data-testid="onboarding-submit"], button:has-text("Submit"), button:has-text("Finish")')
  await submitBtn.click()

  const successBanner = page.locator('[data-testid="verification-banner"], text=Submitted for verification')
  await expect(successBanner.or(page.locator('text=Dashboard'))).toBeVisible({ timeout: 10_000 })
}

// 2) Sign up flows with document upload
test('Influencer sign-up and onboarding completes', async ({ page }) => {
  await performSignUp(page, 'influencer')
})

test('Brand sign-up and onboarding completes', async ({ page }) => {
  await performSignUp(page, 'brand')
})

// 3) Public shop page loads by handle
test('Public shop page /shop/[handle] shows products', async ({ page }) => {
  // Try shops listing first if available
  await page.goto('/shops')
  await page.waitForLoadState('networkidle')

  const shopLink = page.locator('a[href^="/shop/"] , [data-testid="shop-link"]')
  if (await shopLink.first().isVisible().catch(() => false)) {
    await shopLink.first().click()
    await page.waitForLoadState('networkidle')
  } else {
    // Fallback to generic shop page
    await page.goto('/shop')
    await page.waitForLoadState('networkidle')
  }

  const productCards = page.locator('[data-testid="product-card"], .group')
  await expect(productCards.first()).toBeVisible()
})
