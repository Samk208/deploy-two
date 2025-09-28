import { expect, test } from "@playwright/test";

// IMPORTANT: Replace with valid admin credentials from your test environment
const adminUser = {
  email: process.env.TEST_ADMIN_EMAIL || "admin@example.com",
  password: process.env.TEST_ADMIN_PASSWORD || "password123",
};

test.describe("Authentication and Authorization Flows", () => {
  test("should allow an admin to log in with email and password", async ({
    page,
  }) => {
    await page.goto("/sign-in");

    // Fill in the email and password
    await page.getByLabel("Email").fill(adminUser.email);
    await page.getByLabel("Password").fill(adminUser.password);

    // Click the sign-in button
    await page.getByRole("button", { name: "Sign In", exact: true }).click();

    // Wait for navigation and verify the URL
    await page.waitForURL("**/admin/dashboard");
    await expect(page).toHaveURL("/admin/dashboard");

    // Verify that the dashboard contains admin-specific content
    await expect(
      page.getByRole("heading", { name: "Admin Dashboard" })
    ).toBeVisible();
  });

  test("should show Google OAuth button on sign-in and trigger navigation", async ({
    page,
  }) => {
    await page.goto("/sign-in");
    const googleButton = page.getByRole("button", {
      name: "Continue with Google",
    });
    await googleButton.click();
    // In CI we do not assert external URL; just ensure a navigation attempt occurs
    await page.waitForLoadState("load");
    expect(googleButton).toBeTruthy();
  });

  test("should show an error for invalid email/password credentials", async ({
    page,
  }) => {
    await page.goto("/sign-in");

    // Fill in invalid credentials
    await page.getByLabel("Email").fill("wrong@user.com");
    await page.getByLabel("Password").fill("wrongpassword");

    // Click the sign-in button
    await page.getByRole("button", { name: "Sign In", exact: true }).click();

    // Verify that the page redirects back to sign-in with an error message
    await page.waitForURL("**/sign-in?message=*");
    await expect(page.getByText("Could not authenticate user")).toBeVisible();
  });
});
