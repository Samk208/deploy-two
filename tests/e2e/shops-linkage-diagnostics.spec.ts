import { test, expect } from '@playwright/test'

// Diagnostics for shop listing, product linkage, and distribution across influencer shops.
// Uses public pages and /api/shop/[handle]. Adjust HANDLE_LIST if you rename shops.

const HANDLES = [
  // Expect these to exist in dev
  'style-forward',
  'tech-trends',
  'influencer-alex',
]

async function fetchShopProducts(request: any, baseURL: string, handle: string) {
  const res = await request.get(`${baseURL}/api/shop/${handle}`)
  expect(res.ok(), `API /api/shop/${handle} failed`).toBeTruthy()
  const json = (await res.json()) as any
  expect(json?.ok, `API /api/shop/${handle} ok=false`).toBeTruthy()
  return json?.data?.products ?? []
}

test.describe('Influencer shops linkage diagnostics', () => {
  test('directory renders and shows multiple shops', async ({ page }) => {
    await page.goto('/shops')

    // Title visible
    await expect(page.getByText(/Discover/i)).toBeVisible()

    // Cards appear, then hydrate (catch case where they flicker to fewer)
    const cards = page.getByRole('button', { name: /Visit Shop/i })
    await expect(cards.first()).toBeVisible()

    // After hydration, we should still have at least 2-3 shops
    const count = await cards.count()
    expect(count).toBeGreaterThan(1)
  })

  test('each influencer shop API returns products as expected', async ({ request, baseURL }) => {
    const results: Record<string, any[]> = {}

    for (const handle of HANDLES) {
      const products = await fetchShopProducts(request, baseURL!, handle)
      results[handle] = products
    }

    // style-forward should be trimmed to exactly 3 per our seed/rules
    expect(Array.isArray(results['style-forward'])).toBeTruthy()
    if (results['style-forward']) {
      expect(results['style-forward'].length).toBe(3)
    }

    // Others should have >= 1 (usually more after distribution)
    for (const handle of HANDLES.filter(h => h !== 'style-forward')) {
      expect(results[handle].length).toBeGreaterThan(0)
    }

    // No duplicate product IDs across shops (within sampled sets)
    const seen = new Set<string>()
    for (const [handle, items] of Object.entries(results)) {
      for (const p of items) {
        if (!p?.id) continue
        const key = String(p.id)
        expect(seen.has(key)).toBeFalsy()
        seen.add(key)
      }
    }
  })

  test('shop pages render cards for each handle and first image is visible', async ({ page }) => {
    for (const handle of HANDLES) {
      await page.goto(`/shop/${handle}`)
      await expect(page.getByText(/This page could not be found/i)).toHaveCount(0)
      const card = page.getByTestId('product-card').first()
      await expect(card, `no product card for ${handle}`).toBeVisible()

      const img = card.locator('img[alt]')
      await expect(img.first()).toBeVisible()
      const box = await img.first().boundingBox()
      expect(box).toBeTruthy()
      if (box) {
        expect(box.height).toBeGreaterThan(60)
        expect(box.width).toBeGreaterThan(60)
      }
    }
  })
})

// Optional: lightweight checkout smoke using the first product from tech-trends
// Skips if STRIPE_SECRET_KEY is missing so you can run without Stripe locally.

test.describe('Checkout smoke', () => {
  test('creates Checkout session from tech-trends (if Stripe configured)', async ({ request, baseURL }) => {
    test.skip(!process.env.STRIPE_SECRET_KEY, 'STRIPE_SECRET_KEY missing; skipping checkout test')

    const handle = 'tech-trends'
    const products = await fetchShopProducts(request, baseURL!, handle)
    expect(products.length).toBeGreaterThan(0)

    const first = products[0]
    const payload = {
      items: [
        {
          productId: first.id,
          quantity: 1,
          shopHandle: handle,
          effectivePrice: first.price,
          image: first.images?.[0] ?? first.image,
          title: first.title,
        },
      ],
      shippingAddress: { line1: '123 Test', city: 'Seoul', country: 'KR' },
      billingAddress: { line1: '123 Test', city: 'Seoul', country: 'KR' },
    }

    const res = await request.post(`${baseURL}/api/checkout`, { data: payload })
    expect(res.ok()).toBeTruthy()
    const json = (await res.json()) as any
    expect(json?.ok).toBeTruthy()
    expect(json?.data?.sessionId).toBeTruthy()
    expect(String(json?.data?.url)).toContain('checkout')
  })
})
