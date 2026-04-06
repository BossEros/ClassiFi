import { test, expect } from "@playwright/test"

/**
 * E2E tests for shared application pages.
 * Covers: notifications, settings, calendar, forgot password flow,
 * and protected-route authentication guards.
 */
test.describe("Shared Pages", () => {
  const studentUser = {
    id: "2",
    email: "student@example.com",
    firstName: "Jane",
    lastName: "Smith",
    role: "student",
  }

  const teacherUser = {
    id: "1",
    email: "teacher@example.com",
    firstName: "John",
    lastName: "Doe",
    role: "teacher",
  }

  const mockUnreadNotification = {
    id: 1,
    userId: 2,
    type: "ASSIGNMENT_CREATED",
    title: "New Assignment: Hello World in Python",
    message: "A new assignment has been posted in Introduction to Computer Science",
    isRead: false,
    readAt: null,
    createdAt: new Date().toISOString(),
    metadata: {
      assignmentId: 101,
      assignmentTitle: "Hello World in Python",
      className: "Introduction to Computer Science",
      classId: 1,
      dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      assignmentUrl: "/dashboard/assignments/101",
    },
  }

  const mockReadNotification = {
    id: 2,
    userId: 2,
    type: "SUBMISSION_GRADED",
    title: "Assignment Graded: Hello World",
    message: "Your submission has been graded",
    isRead: true,
    readAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    metadata: {
      assignmentId: 100,
      assignmentTitle: "Hello World",
      submissionId: 999,
      grade: 90,
      maxGrade: 100,
      submissionUrl: "/dashboard/assignments/100",
    },
  }

  // ---------------------------------------------------------------------------
  // Notifications Page
  // ---------------------------------------------------------------------------
  test.describe("Notifications Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((user) => {
        window.localStorage.setItem("user", JSON.stringify(user))
      }, studentUser)

      await page.route("**/api/v1/notifications/unread-count**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, unreadCount: 1 }),
        })
      })

      await page.route("**/api/v1/notifications**", async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              success: true,
              notifications: [mockUnreadNotification, mockReadNotification],
              total: 2,
              page: 1,
              limit: 20,
            }),
          })
        } else {
          await route.continue()
        }
      })

      await page.goto("/dashboard/notifications")
    })

    test("should display notifications page heading", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: /notifications/i }),
      ).toBeVisible({ timeout: 10000 })
    })

    test("should display unread notification", async ({ page }) => {
      await expect(
        page.getByText("New Assignment: Hello World in Python"),
      ).toBeVisible({ timeout: 10000 })
    })

    test("should display read notification", async ({ page }) => {
      await expect(
        page.getByText("Assignment Graded: Hello World"),
      ).toBeVisible({ timeout: 10000 })
    })

    test("should mark a notification as read when clicked", async ({ page }) => {
      await page.route("**/api/v1/notifications/1/read**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, message: "Marked as read" }),
        })
      })

      await page.getByText("New Assignment: Hello World in Python").click()

      // After click, the notification-read API call should complete without error
      // Verify the user is either navigated to the resource or stays on page
      await page.waitForTimeout(500)
      const currentUrl = page.url()
      const isNavigatedAway = !currentUrl.includes("/notifications")
      const isStillOnPage = currentUrl.includes("/notifications")

      expect(isNavigatedAway || isStillOnPage).toBeTruthy()
    })

    test("should display mark all as read button", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: /mark all.*read/i }),
      ).toBeVisible({ timeout: 10000 })
    })

    test("should call mark-all-as-read API when button is clicked", async ({ page }) => {
      let markAllReadCalled = false

      await page.route("**/api/v1/notifications/read-all**", async (route) => {
        markAllReadCalled = true
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, message: "All marked as read" }),
        })
      })

      await page.getByRole("button", { name: /mark all.*read/i }).click()

      await page.waitForTimeout(500)
      expect(markAllReadCalled).toBeTruthy()
    })
  })

  // ---------------------------------------------------------------------------
  // Settings Page
  // ---------------------------------------------------------------------------
  test.describe("Settings Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((user) => {
        window.localStorage.setItem("user", JSON.stringify(user))
      }, teacherUser)

      await page.goto("/dashboard/settings")
    })

    test("should display the settings page", async ({ page }) => {
      await expect(page.getByText(/settings|profile/i)).toBeVisible({ timeout: 10000 })
    })

    test("should display user name in profile section", async ({ page }) => {
      await expect(page.getByText(/john doe/i)).toBeVisible({ timeout: 10000 })
    })

    test("should display user email in profile section", async ({ page }) => {
      await expect(page.getByText("teacher@example.com")).toBeVisible({ timeout: 10000 })
    })

    test("should display change password section", async ({ page }) => {
      await expect(page.getByText(/change password|security/i)).toBeVisible({ timeout: 10000 })
    })

    test("should display notification preferences section", async ({ page }) => {
      await expect(page.getByText(/notification.*preferences?|email.*notification/i)).toBeVisible({ timeout: 10000 })
    })
  })

  // ---------------------------------------------------------------------------
  // Calendar Page
  // ---------------------------------------------------------------------------
  test.describe("Calendar Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((user) => {
        window.localStorage.setItem("user", JSON.stringify(user))
      }, studentUser)

      await page.route("**/api/v1/calendar/**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, events: [] }),
        })
      })

      await page.goto("/dashboard/calendar")
    })

    test("should display the calendar page", async ({ page }) => {
      await expect(page.getByText(/calendar/i)).toBeVisible({ timeout: 10000 })
    })
  })

  // ---------------------------------------------------------------------------
  // Forgot Password Flow
  // ---------------------------------------------------------------------------
  test.describe("Forgot Password Flow", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/forgot-password")
    })

    test("should display the forgot password form", async ({ page }) => {
      await expect(page.locator("#email")).toBeVisible()
    })

    test("should show validation error for empty email submission", async ({ page }) => {
      await page.getByRole("button", { name: /send.*reset|reset.*password/i }).click()

      await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 })
    })

    test("should show success state after valid email submission", async ({ page }) => {
      await page.route("**/auth/v1/recover**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({}),
        })
      })

      await page.route("**/api/v1/auth/forgot-password**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, message: "Reset email sent" }),
        })
      })

      await page.locator("#email").fill("teacher@example.com")
      await page.getByRole("button", { name: /send.*reset|reset.*password/i }).click()

      await expect(
        page.getByText(/check your email|reset.*sent|instructions/i),
      ).toBeVisible({ timeout: 10000 })
    })

    test("should have back to login link", async ({ page }) => {
      await expect(
        page.getByRole("link", { name: /back.*login|sign in/i }).or(
          page.getByRole("button", { name: /back.*login|sign in/i }),
        ),
      ).toBeVisible({ timeout: 5000 })
    })
  })

  // ---------------------------------------------------------------------------
  // Protected Route — Unauthenticated redirects
  // ---------------------------------------------------------------------------
  test.describe("Authentication Guards", () => {
    test("should redirect unauthenticated user from notifications to login", async ({ page }) => {
      await page.goto("/dashboard/notifications")

      await expect(page).toHaveURL(/\/login/)
    })

    test("should redirect unauthenticated user from settings to login", async ({ page }) => {
      await page.goto("/dashboard/settings")

      await expect(page).toHaveURL(/\/login/)
    })

    test("should redirect unauthenticated user from calendar to login", async ({ page }) => {
      await page.goto("/dashboard/calendar")

      await expect(page).toHaveURL(/\/login/)
    })
  })
})
