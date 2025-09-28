import { expect, test } from "@playwright/test";

test.describe("Supplier Commission Management", () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication - supplier user
    await page.route("**/api/auth/**", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            data: {
              id: "supplier-test-id",
              email: "supplier@test.com",
              name: "Test Supplier",
              role: "supplier",
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock products API responses
    await page.route("**/api/products**", async (route) => {
      const url = new URL(route.request().url());

      if (
        route.request().method() === "GET" &&
        !url.pathname.includes("[id]")
      ) {
        // List products
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            data: [
              {
                id: "product-1",
                title: "Test Product 1",
                description: "Test description",
                price: 100,
                commission: 15,
                stockCount: 50,
                category: "Electronics",
                region: ["KR"],
                images: ["https://example.com/image1.jpg"],
                supplierId: "supplier-test-id",
                createdAt: "2024-01-01T00:00:00Z",
                updatedAt: "2024-01-01T00:00:00Z",
              },
            ],
            pagination: {
              page: 1,
              limit: 10,
              total: 1,
              totalPages: 1,
              hasNext: false,
              hasPrev: false,
            },
          }),
        });
      } else if (route.request().method() === "POST") {
        // Create product
        const body = await route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            data: {
              id: "new-product-id",
              ...body,
              supplierId: "supplier-test-id",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            message: "Product created successfully",
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock individual product API
    await page.route("**/api/products/product-1", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            data: {
              id: "product-1",
              title: "Test Product 1",
              description: "Test description",
              price: 100,
              commission: 15,
              stockCount: 50,
              category: "Electronics",
              region: ["KR"],
              images: ["https://example.com/image1.jpg"],
              supplierId: "supplier-test-id",
              createdAt: "2024-01-01T00:00:00Z",
              updatedAt: "2024-01-01T00:00:00Z",
            },
          }),
        });
      } else if (route.request().method() === "PUT") {
        const body = await route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            data: {
              id: "product-1",
              title: "Test Product 1",
              description: "Test description",
              price: 100,
              commission: body.commission || 15,
              stockCount: body.stockCount || 50,
              category: "Electronics",
              region: ["KR"],
              images: ["https://example.com/image1.jpg"],
              supplierId: "supplier-test-id",
              createdAt: "2024-01-01T00:00:00Z",
              updatedAt: new Date().toISOString(),
            },
            message: "Product updated successfully",
          }),
        });
      }
    });

    // Mock dashboard API
    await page.route("**/api/dashboard/supplier", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          data: {
            stats: {
              totalProducts: 5,
              totalRevenue: 12450,
              totalSales: 124,
              activeOrders: 8,
              commissionEarned: 2490,
              influencerPartners: 12,
            },
            todayStats: {
              sales: 3,
              revenue: 450,
              orders: 2,
            },
            thisMonthStats: {
              sales: 45,
              revenue: 5600,
              orders: 23,
              newProducts: 2,
            },
            topProducts: [
              {
                id: "product-1",
                title: "Test Product 1",
                sales: 45,
                revenue: 4500,
                commission: 15,
                stock: 50,
              },
            ],
            recentOrders: [
              {
                id: "order-1",
                customerName: "John Doe",
                productTitle: "Test Product 1",
                quantity: 2,
                total: 200,
                commission: 30,
                status: "processing",
                createdAt: "2024-01-01T00:00:00Z",
              },
            ],
          },
        }),
      });
    });
  });

  test("supplier can create product with commission percentage", async ({
    page,
  }) => {
    await page.goto("/dashboard/supplier/products/new");

    // Fill product form
    await page.fill('[data-testid="product-title"]', "New Commission Product");
    await page.fill(
      '[data-testid="product-description"]',
      "A product with custom commission"
    );
    await page.fill('[data-testid="product-price"]', "150");
    await page.fill('[data-testid="product-commission"]', "25");
    await page.fill('[data-testid="product-stock"]', "100");
    await page.click('[data-testid="product-category"]');

    await page.getByRole("option", { name: "Electronics" }).click();
    await page.fill(
      '[data-testid="product-images"]',
      "https://example.com/product.jpg"
    );

    // Select regions
    await page.check('[data-testid="region-kr"]');
    await page.check('[data-testid="region-global"]');

    // Submit form
    await page.click('[data-testid="submit-product"]');

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText(
      "Product created successfully"
    );
  });

  test("supplier can edit commission percentage on existing product", async ({
    page,
  }) => {
    await page.goto("/dashboard/supplier/products");

    // Click edit on first product
    await page.click('[data-testid="edit-product-product-1"]');

    // Wait for edit form to load
    await expect(
      page.locator('[data-testid="product-commission"]')
    ).toBeVisible();

    // Verify current commission value
    await expect(
      page.locator('[data-testid="product-commission"]')
    ).toHaveValue("15");

    // Update commission percentage
    await page.fill('[data-testid="product-commission"]', "20");

    // Save changes
    await page.click('[data-testid="save-product"]');

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText(
      "Product updated successfully"
    );
  });

  test("commission validation enforces 0-95% range", async ({ page }) => {
    await page.goto("/dashboard/supplier/products/new");

    // Fill required fields
    await page.fill('[data-testid="product-title"]', "Test Product");
    await page.fill('[data-testid="product-description"]', "Test description");
    await page.fill('[data-testid="product-price"]', "100");
    await page.fill('[data-testid="product-stock"]', "50");

    // Test invalid commission values
    await page.fill('[data-testid="product-commission"]', "100");
    await page.click('[data-testid="submit-product"]');

    await expect(
      page.locator('[data-testid="commission-error"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="commission-error"]')
    ).toContainText("Commission must be between 0-95%");

    // Test negative commission
    await page.fill('[data-testid="product-commission"]', "-5");
    await page.click('[data-testid="submit-product"]');

    await expect(
      page.locator('[data-testid="commission-error"]')
    ).toBeVisible();

    // Test valid commission
    await page.fill('[data-testid="product-commission"]', "25");
    await page.click('[data-testid="product-category"]');

    await page.getByRole("option", { name: "Electronics" }).click();
    await page.fill(
      '[data-testid="product-images"]',
      "https://example.com/image.jpg"
    );
    await page.check('[data-testid="region-kr"]');

    await page.click('[data-testid="submit-product"]');

    // Should not show commission error
    await expect(
      page.locator('[data-testid="commission-error"]')
    ).not.toBeVisible();
  });

  test("supplier dashboard displays commission metrics", async ({ page }) => {
    await page.goto("/dashboard/supplier");

    // Wait for dashboard to load
    await expect(
      page.locator('[data-testid="dashboard-loading"]')
    ).not.toBeVisible();

    // Verify commission earned KPI
    await expect(
      page.locator('[data-testid="commission-earned"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="commission-earned"]')
    ).toContainText("$2,490");

    // Verify total revenue KPI
    await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-revenue"]')).toContainText(
      "$12,450"
    );

    // Verify today's performance section
    await expect(page.locator('[data-testid="today-revenue"]')).toContainText(
      "$450"
    );
    await expect(page.locator('[data-testid="today-sales"]')).toContainText(
      "3"
    );
    await expect(page.locator('[data-testid="today-orders"]')).toContainText(
      "2"
    );
  });

  test("top products show commission percentages", async ({ page }) => {
    await page.goto("/dashboard/supplier");

    // Wait for dashboard to load
    await expect(
      page.locator('[data-testid="dashboard-loading"]')
    ).not.toBeVisible();

    // Verify top products section
    await expect(page.locator('[data-testid="top-products"]')).toBeVisible();

    // Check first product shows commission badge
    const firstProduct = page.locator('[data-testid="product-product-1"]');
    await expect(firstProduct).toBeVisible();
    await expect(
      firstProduct.locator('[data-testid="commission-badge"]')
    ).toContainText("15%");

    // Verify product sales and revenue data
    await expect(firstProduct).toContainText("45 sales");
    await expect(firstProduct).toContainText("$4,500 revenue");
  });

  test("recent orders show commission earnings", async ({ page }) => {
    await page.goto("/dashboard/supplier");

    // Wait for dashboard to load
    await expect(
      page.locator('[data-testid="dashboard-loading"]')
    ).not.toBeVisible();

    // Verify recent orders section
    await expect(page.locator('[data-testid="recent-orders"]')).toBeVisible();

    // Check first order shows commission
    const firstOrder = page.locator('[data-testid="order-order-1"]');
    await expect(firstOrder).toBeVisible();
    await expect(firstOrder).toContainText("John Doe");
    await expect(firstOrder).toContainText("$200.00");
    await expect(firstOrder).toContainText("+$30.00 commission");
  });

  test("supplier can only edit own products", async ({ page }) => {
    // Mock API to return unauthorized for different supplier's product
    await page.route(
      "**/api/products/other-supplier-product",
      async (route) => {
        if (route.request().method() === "PUT") {
          await route.fulfill({
            status: 403,
            contentType: "application/json",
            body: JSON.stringify({
              ok: false,
              error: "You can only edit your own products",
            }),
          });
        }
      }
    );

    await page.goto("/dashboard/supplier/products/other-supplier-product/edit");

    // Try to update commission
    await page.fill('[data-testid="product-commission"]', "30");
    await page.click('[data-testid="save-product"]');

    // Verify error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      "You can only edit your own products"
    );
  });

  test("products can be filtered by region restrictions", async ({ page }) => {
    // Mock products API with region filtering
    await page.route("**/api/products?*region=KR*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          data: [
            {
              id: "kr-product",
              title: "Korea Only Product",
              commission: 20,
              region: ["KR"],
              supplierId: "supplier-test-id",
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        }),
      });
    });

    await page.goto("/dashboard/supplier/products");

    // Apply region filter
    await page.click('[data-testid="region-filter"]');
    await page.getByRole("option", { name: "KR" }).click();
    await page.click('[data-testid="apply-filters"]');

    // Verify filtered results
    await expect(
      page.locator('[data-testid="product-kr-product"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="product-kr-product"]')
    ).toContainText("Korea Only Product");
  });

  test("commission earnings are calculated correctly in orders", async ({
    page,
  }) => {
    // Mock order with commission calculation
    const mockOrder = {
      id: "test-order",
      items: [
        {
          product_id: "product-1",
          title: "Test Product",
          price: 100,
          quantity: 2,
          commission: 15, // 15% commission
        },
      ],
      total: 200,
      commission_earned: 30, // 15% of 200
    };

    await page.route("**/api/orders/test-order", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          data: mockOrder,
        }),
      });
    });

    await page.goto("/dashboard/supplier/orders/test-order");

    // Verify commission calculation display
    await expect(page.locator('[data-testid="order-total"]')).toContainText(
      "$200.00"
    );
    await expect(
      page.locator('[data-testid="commission-earned"]')
    ).toContainText("$30.00");
    await expect(page.locator('[data-testid="commission-rate"]')).toContainText(
      "15%"
    );
  });
});

test.describe("Supplier Commission Edge Cases", () => {
  test("handles zero commission products", async ({ page }) => {
    await page.route("**/api/products", async (route) => {
      if (route.request().method() === "POST") {
        const body = await route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            data: { ...body, id: "zero-commission-product", commission: 0 },
          }),
        });
      }
    });

    await page.goto("/dashboard/supplier/products/new");

    // Create product with 0% commission
    await page.fill('[data-testid="product-title"]', "Zero Commission Product");
    await page.fill(
      '[data-testid="product-description"]',
      "No commission product"
    );
    await page.fill('[data-testid="product-price"]', "50");
    await page.fill('[data-testid="product-commission"]', "0");
    await page.fill('[data-testid="product-stock"]', "25");
    await page.click('[data-testid="product-category"]');

    await page.getByRole("option", { name: "Electronics" }).click();
    await page.fill(
      '[data-testid="product-images"]',
      "https://example.com/image.jpg"
    );
    await page.check('[data-testid="region-global"]');

    await page.click('[data-testid="submit-product"]');

    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test("handles maximum commission of 95%", async ({ page }) => {
    await page.goto("/dashboard/supplier/products/new");

    // Test maximum allowed commission
    await page.fill('[data-testid="product-commission"]', "95");

    // Fill other required fields
    await page.fill('[data-testid="product-title"]', "Max Commission Product");
    await page.fill(
      '[data-testid="product-description"]',
      "Maximum commission product"
    );
    await page.fill('[data-testid="product-price"]', "100");
    await page.fill('[data-testid="product-stock"]', "10");
    await page.click('[data-testid="product-category"]');

    await page.getByRole("option", { name: "Electronics" }).click();
    await page.fill(
      '[data-testid="product-images"]',
      "https://example.com/image.jpg"
    );
    await page.check('[data-testid="region-global"]');

    await page.click('[data-testid="submit-product"]');

    // Should not show validation error
    await expect(
      page.locator('[data-testid="commission-error"]')
    ).not.toBeVisible();
  });
});
