import { test, expect } from '@playwright/test'

// Validates that an influencer shop page renders products (seeded in global-setup)
// and that card images are visible with non-trivial size.

const HANDLE = 'style-forward'

test.describe('Influencer shop page', () => {
  test('renders products and images for /shop/[handle]', async ({ page }) => {
    await page.goto(`/shop/${HANDLE}`)

    // Should not 404
    await expect(page.getByText(/This page could not be found/i)).toHaveCount(0)

    // At least one product card should be visible
    const grid = page.locator('[data-testid="shop-main"], main')
    await expect(grid).toBeVisible()

    const card = page.getByTestId('product-card').first()
    await expect(card).toBeVisible()

    const img = card.locator('img[alt]')
    await expect(img.first()).toBeVisible()

    const box = await img.first().boundingBox()
    expect(box).toBeTruthy()
    if (box) {
      expect(box.height).toBeGreaterThan(60)
      expect(box.width).toBeGreaterThan(60)
    }
  })
})
