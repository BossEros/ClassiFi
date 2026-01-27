import { test, expect } from "@playwright/test"

/**
 * E2E tests for authentication flows.
 * Tests login, logout, and error handling.
 */
test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    // Start from the login page before each test
    await page.goto("/login")
  })

  test("should display login form", async ({ page }) => {
    // Verify login page elements are present
    await expect(page.locator("#email")).toBeVisible()
    await expect(page.locator("#password")).toBeVisible()
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible()
  })

  test("should show validation error for invalid email format", async ({
    page,
  }) => {
    // Enter invalid email
    await page.locator("#email").fill("invalidemail")
    await page.locator("#password").click() // Blur email field

    // Check for email validation error
    await expect(page.getByRole("alert")).toBeVisible()
  })

  test("should show error message for invalid credentials", async ({
    page,
  }) => {
    // Fill in invalid credentials
    await page.locator("#email").fill("wrong@example.com")
    await page.locator("#password").fill("wrongpassword")

    // Submit the form
    await page.getByRole("button", { name: /sign in/i }).click()

    // Wait for and verify error message
    await expect(page.locator(".bg-red-500\\/10")).toBeVisible({
      timeout: 10000,
    })
  })

  test("should toggle password visibility", async ({ page }) => {
    // Fill password
    await page.locator("#password").fill("TestPassword123")

    // Initially password should be hidden
    await expect(page.locator("#password")).toHaveAttribute("type", "password")

    // Click show password button
    await page.getByRole("button", { name: /show password/i }).click()

    // Password should now be visible
    await expect(page.locator("#password")).toHaveAttribute("type", "text")

    // Click hide password button
    await page.getByRole("button", { name: /hide password/i }).click()

    // Password should be hidden again
    await expect(page.locator("#password")).toHaveAttribute("type", "password")
  })

  test("should navigate to register page", async ({ page }) => {
    // Click create account link
    await page.getByRole("button", { name: /create account/i }).click()

    // Verify navigation to register page
    await expect(page).toHaveURL(/\/register/)
  })

  test("should show loading state while submitting", async ({ page }) => {
    // Fill in credentials
    await page.locator("#email").fill("test@example.com")
    await page.locator("#password").fill("TestPassword123!")

    // Submit the form
    await page.getByRole("button", { name: /sign in/i }).click()

    // Verify loading state (button should show loading text)
    await expect(
      page.getByRole("button", { name: /signing in/i }),
    ).toBeVisible()
  })
})
