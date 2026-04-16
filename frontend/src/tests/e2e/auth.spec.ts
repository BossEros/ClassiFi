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

  test("should block inactive teachers with the administrator approval message", async ({
    page,
  }) => {
    await page.route("**/auth/v1/token**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "teacher-token",
          refresh_token: "teacher-refresh-token",
          token_type: "bearer",
          expires_in: 3600,
          user: {
            id: "teacher-supabase-id",
            email: "teacher@example.com",
          },
        }),
      })
    })

    await page.route("**/auth/v1/logout", async (route) => {
      await route.fulfill({
        status: 204,
        body: "",
      })
    })

    await page.route("**/api/v1/auth/verify", async (route) => {
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message:
            "Your access is pending administrator approval. You will be able to sign in once your account has been reviewed and approved by the admin",
        }),
      })
    })

    await page.locator("#email").fill("teacher@example.com")
    await page.locator("#password").fill("TeacherPass123!")
    await page.getByRole("button", { name: /sign in/i }).click()

    await expect(
      page.getByText(
        "Your access is pending administrator approval. You will be able to sign in once your account has been reviewed and approved by the admin",
      ),
    ).toBeVisible({ timeout: 10000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test("should allow approved teachers to sign in", async ({ page }) => {
    await page.route("**/auth/v1/token**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "teacher-token",
          refresh_token: "teacher-refresh-token",
          token_type: "bearer",
          expires_in: 3600,
          user: {
            id: "teacher-supabase-id",
            email: "teacher@example.com",
          },
        }),
      })
    })

    await page.route("**/api/v1/auth/verify", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          user: {
            id: "2",
            email: "teacher@example.com",
            firstName: "Teacher",
            lastName: "Approved",
            role: "teacher",
            isActive: true,
            emailNotificationsEnabled: true,
            inAppNotificationsEnabled: true,
            createdAt: new Date().toISOString(),
          },
        }),
      })
    })

    await page.route("**/api/v1/teacher/dashboard/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            recentClasses: [],
            pendingTasks: [],
          },
        }),
      })
    })

    await page.route("**/api/v1/notifications/unread-count", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          unreadCount: 0,
        }),
      })
    })

    await page.locator("#email").fill("teacher@example.com")
    await page.locator("#password").fill("TeacherPass123!")
    await page.getByRole("button", { name: /sign in/i }).click()

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    await expect(page.getByText(/welcome back, teacher/i)).toBeVisible({
      timeout: 10000,
    })
  })
})
