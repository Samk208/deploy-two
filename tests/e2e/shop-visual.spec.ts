import { test, expect } from '@playwright/test'

// Verifies product images render in Grid and List views and that Quick View shows full image
// Relies on EnhancedShopPage at /shop using EnhancedProductCard cards with data-testid="product-card"

test.describe('Shop product images', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/shop')
    await expect(page.getByTestId('shop-main')).toBeVisible()
    // Wait for at least one product card
    await expect(page.getByTestId('product-card').first()).toBeVisible()
  })

  test('Grid view: product image area has sensible height and is visible', async ({ page }) => {
    // Ensure Grid is active
    await page.getByRole('button', { name: 'Grid' }).click()

    const card = page.getByTestId('product-card').first()
    await expect(card).toBeVisible()

    // Find an <img> inside the card (rendered by next/image)
    const img = card.locator('img[alt]')
    await expect(img).toBeVisible()

    // Sanity-check layout: image bounding box height should be > 80px in grid
    const box = await img.boundingBox()
    expect(box).toBeTruthy()
    if (box) {
      expect(box.height).toBeGreaterThan(80)
      expect(box.width).toBeGreaterThan(80)
    }
  })

  test('List view: product image area does not collapse to a thin strip', async ({ page }) => {
    await page.getByRole('button', { name: 'List' }).click()

    const card = page.getByTestId('product-card').first()
    await expect(card).toBeVisible()

    const img = card.locator('img[alt]')
    await expect(img).toBeVisible()

    const box = await img.boundingBox()
    expect(box).toBeTruthy()
    if (box) {
      // In list, height should still be reasonable (avoid ~0-10px strip)
      expect(box.height).toBeGreaterThan(60)
      expect(box.width).toBeGreaterThan(120)
    }
  })

  test('Quick View shows full image', async ({ page }) => {
    const card = page.getByTestId('product-card').first()

    // Hover to reveal overlay Quick View button if present
    await card.hover()

    // If overlay button is not present, use the action button with Eye icon (second button)
    const quickViewOverlay = page.getByRole('button', { name: 'Quick View' })
    if (await quickViewOverlay.isVisible().catch(() => false)) {
      await quickViewOverlay.click()
    } else {
      // Fallback: click the last button inside actions area (has Eye icon)
      const actions = card.locator('button')
      const count = await actions.count()
      await actions.nth(Math.max(0, count - 1)).click()
    }

    // Expect a modal with a large product image
    // Look for an img inside a dialog
    const dialog = page.locator('div[role="dialog"]')
    await expect(dialog).toBeVisible()

    const modalImg = dialog.locator('img[alt]')
    await expect(modalImg.first()).toBeVisible()

    const mbox = await modalImg.first().boundingBox()
    expect(mbox).toBeTruthy()
    if (mbox) {
      expect(mbox.height).toBeGreaterThan(150)
      expect(mbox.width).toBeGreaterThan(150)
    }
  })
})
