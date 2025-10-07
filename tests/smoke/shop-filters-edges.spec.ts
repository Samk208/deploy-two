import { test, expect } from "@playwright/test";

test("filters edge cases", async ({ page }) => {
  await page.goto("/shop");

  // price range
  await page.getByLabel("Minimum price").fill("10");
  await page.getByLabel("Maximum price").fill("200");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page).toHaveURL(/minPrice=10/);
  await expect(page).toHaveURL(/maxPrice=200/);

  // category/brand
  await page.getByLabel("Category").fill("Audio");
  await page.getByLabel("Brand").fill("Acme");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page).toHaveURL(/category=Audio/);
  await expect(page).toHaveURL(/brand=Acme/);

  // in-stock toggle
  const inStock = page.getByLabel("In stock");
  await inStock.check();
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page).toHaveURL(/inStockOnly=true/);

  // pagination
  const nextBtn = page.getByRole("button", { name: "Next" });
  if (await nextBtn.isEnabled()) {
    await nextBtn.click();
    await expect(page).toHaveURL(/page=\d+/);
    await page.getByRole("button", { name: "Previous" }).click();
    await expect(page).toHaveURL(/page=1/);
  }
});
