import { test, expect } from "@playwright/test"

/**
 * E2E tests for the registration flow.
 * Covers role selection, personal details, credentials, and
 * successful/failed registration for both teacher and student roles.
 */
test.describe("Registration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register")
  })

  // ---------------------------------------------------------------------------
  // Step 1 — Role Selection
  // ---------------------------------------------------------------------------
  test.describe("Step 1 - Role Selection", () => {
    test("should display role selection page", async ({ page }) => {
      await expect(page.getByText(/choose your role/i)).toBeVisible()
      await expect(page.getByText(/i am a student/i)).toBeVisible()
      await expect(page.getByText(/i am a teacher/i)).toBeVisible()
    })

    test("should disable Next button when no role is selected", async ({ page }) => {
      await expect(page.getByRole("button", { name: /next/i })).toBeDisabled()
    })

    test("should enable Next button after selecting student role", async ({ page }) => {
      await page.getByText(/i am a student/i).click()

      await expect(page.getByRole("button", { name: /next/i })).toBeEnabled()
    })

    test("should enable Next button after selecting teacher role", async ({ page }) => {
      await page.getByText(/i am a teacher/i).click()

      await expect(page.getByRole("button", { name: /next/i })).toBeEnabled()
    })

    test("should navigate back to login page", async ({ page }) => {
      await page.getByRole("button", { name: /back/i }).click()

      await expect(page).toHaveURL(/\/login/)
    })
  })

  // ---------------------------------------------------------------------------
  // Step 2 — Personal Details
  // ---------------------------------------------------------------------------
  test.describe("Step 2 - Personal Details", () => {
    test.beforeEach(async ({ page }) => {
      // Advance to step 2
      await page.getByText(/i am a student/i).click()
      await page.getByRole("button", { name: /next/i }).click()
      await expect(page.getByText(/enter your personal details/i)).toBeVisible()
    })

    test("should display personal details form fields", async ({ page }) => {
      await expect(page.locator("#firstName")).toBeVisible()
      await expect(page.locator("#lastName")).toBeVisible()
      await expect(page.locator("#email")).toBeVisible()
    })

    test("should disable Next when personal fields are empty", async ({ page }) => {
      await expect(page.getByRole("button", { name: /next/i })).toBeDisabled()
    })

    test("should enable Next after filling all personal fields", async ({ page }) => {
      await page.locator("#firstName").fill("Jane")
      await page.locator("#lastName").fill("Smith")
      await page.locator("#email").fill("jane.smith@example.com")

      await expect(page.getByRole("button", { name: /next/i })).toBeEnabled()
    })

    test("should show validation error for invalid email", async ({ page }) => {
      await page.locator("#firstName").fill("Jane")
      await page.locator("#lastName").fill("Smith")
      await page.locator("#email").fill("invalid-email")

      // Trigger blur to fire validation
      await page.locator("#firstName").click()

      await page.getByRole("button", { name: /next/i }).click()

      await expect(page.locator('[role="alert"]').first()).toBeVisible()
    })

    test("should navigate back to role selection step", async ({ page }) => {
      await page.getByRole("button", { name: /back/i }).click()

      await expect(page.getByText(/choose your role/i)).toBeVisible()
    })
  })

  // ---------------------------------------------------------------------------
  // Step 3 — Credentials
  // ---------------------------------------------------------------------------
  test.describe("Step 3 - Credentials", () => {
    test.beforeEach(async ({ page }) => {
      // Advance to step 3
      await page.getByText(/i am a student/i).click()
      await page.getByRole("button", { name: /next/i }).click()
      await expect(page.getByText(/enter your personal details/i)).toBeVisible()
      await page.locator("#firstName").fill("Jane")
      await page.locator("#lastName").fill("Smith")
      await page.locator("#email").fill("jane.smith@example.com")
      await page.getByRole("button", { name: /next/i }).click()
      await expect(page.getByText(/set your password/i)).toBeVisible()
    })

    test("should display password and confirm password fields", async ({ page }) => {
      await expect(page.locator("#password")).toBeVisible()
      await expect(page.locator("#confirmPassword")).toBeVisible()
    })

    test("should toggle password visibility", async ({ page }) => {
      await page.locator("#password").fill("TestPass123!")

      await expect(page.locator("#password")).toHaveAttribute("type", "password")

      await page.getByRole("button", { name: /show password/i }).first().click()

      await expect(page.locator("#password")).toHaveAttribute("type", "text")
    })

    test("should navigate back to personal details step", async ({ page }) => {
      await page.getByRole("button", { name: /back/i }).click()

      await expect(page.getByText(/enter your personal details/i)).toBeVisible()
    })

    test("should show error when passwords do not match", async ({ page }) => {
      await page.locator("#password").fill("StrongPass123!")
      await page.locator("#confirmPassword").fill("DifferentPass456!")

      await page.getByRole("button", { name: /next/i }).click()

      await expect(page.locator('[role="alert"]').first()).toBeVisible()
    })
  })

  // ---------------------------------------------------------------------------
  // Complete Student Registration (mocked API)
  // ---------------------------------------------------------------------------
  test.describe("Successful Registration", () => {
    test("should complete student registration flow", async ({ page }) => {
      // Mock the Supabase/auth registration endpoint
      await page.route("**/auth/v1/signup", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            access_token: "mock-access-token",
            token_type: "bearer",
            user: {
              id: "mock-user-id",
              email: "jane.smith@test.com",
              email_confirmed_at: null,
            },
          }),
        })
      })

      await page.route("**/api/v1/auth/register", async (route) => {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            message: "Registration successful",
            user: {
              id: "1",
              email: "jane.smith@test.com",
              firstName: "Jane",
              lastName: "Smith",
              role: "student",
              isActive: true,
            },
          }),
        })
      })

      // Step 1: Select role
      await page.getByText(/i am a student/i).click()
      await page.getByRole("button", { name: /next/i }).click()

      // Step 2: Personal details
      await expect(page.getByText(/enter your personal details/i)).toBeVisible()
      await page.locator("#firstName").fill("Jane")
      await page.locator("#lastName").fill("Smith")
      await page.locator("#email").fill("jane.smith@test.com")
      await page.getByRole("button", { name: /next/i }).click()

      // Step 3: Credentials
      await expect(page.getByText(/set your password/i)).toBeVisible()
      await page.locator("#password").fill("StrongPass123!")
      await page.locator("#confirmPassword").fill("StrongPass123!")
      await page.getByRole("button", { name: /next/i }).click()

      // Verify completion screen
      await expect(page.getByText(/check your email|registration complete|account created/i)).toBeVisible({ timeout: 10000 })
    })

    test("should complete teacher registration flow", async ({ page }) => {
      await page.route("**/auth/v1/signup", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            access_token: "mock-access-token",
            token_type: "bearer",
            user: {
              id: "mock-teacher-id",
              email: "john.doe@school.edu",
              email_confirmed_at: null,
            },
          }),
        })
      })

      await page.route("**/api/v1/auth/register", async (route) => {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            message: "Registration successful",
            user: {
              id: "2",
              email: "john.doe@school.edu",
              firstName: "John",
              lastName: "Doe",
              role: "teacher",
              isActive: false,
            },
          }),
        })
      })

      // Step 1: Teacher role
      await page.getByText(/i am a teacher/i).click()
      await page.getByRole("button", { name: /next/i }).click()

      // Step 2: Personal details
      await expect(page.getByText(/enter your personal details/i)).toBeVisible()
      await page.locator("#firstName").fill("John")
      await page.locator("#lastName").fill("Doe")
      await page.locator("#email").fill("john.doe@school.edu")
      await page.getByRole("button", { name: /next/i }).click()

      // Step 3: Credentials
      await expect(page.getByText(/set your password/i)).toBeVisible()
      await page.locator("#password").fill("TeacherPass123!")
      await page.locator("#confirmPassword").fill("TeacherPass123!")
      await page.getByRole("button", { name: /next/i }).click()

      // Verify completion screen
      await expect(
        page.getByText(
          "Your access is pending administrator approval. You will be able to sign in once your account has been reviewed and approved by the admin",
        ),
      ).toBeVisible({ timeout: 10000 })
    })
  })

  // ---------------------------------------------------------------------------
  // Failed Registration (mocked API)
  // ---------------------------------------------------------------------------
  test.describe("Failed Registration", () => {
    test("should show error when email is already registered", async ({ page }) => {
      await page.route("**/auth/v1/signup", async (route) => {
        await route.fulfill({
          status: 422,
          contentType: "application/json",
          body: JSON.stringify({
            code: "email_exists",
            msg: "User already registered",
          }),
        })
      })

      await page.route("**/api/v1/auth/register", async (route) => {
        await route.fulfill({
          status: 409,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            message: "Email is already registered",
          }),
        })
      })

      await page.getByText(/i am a student/i).click()
      await page.getByRole("button", { name: /next/i }).click()
      await page.locator("#firstName").fill("Jane")
      await page.locator("#lastName").fill("Smith")
      await page.locator("#email").fill("existing@example.com")
      await page.getByRole("button", { name: /next/i }).click()
      await page.locator("#password").fill("StrongPass123!")
      await page.locator("#confirmPassword").fill("StrongPass123!")
      await page.getByRole("button", { name: /next/i }).click()

      // Should show an error message
      await expect(
        page.getByText(/already registered|email.*already|failed/i),
      ).toBeVisible({ timeout: 10000 })
    })
  })
})
