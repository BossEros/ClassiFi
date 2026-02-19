import { test, expect } from "@playwright/test"

/**
 * E2E tests for class management flows.
 * Covers creating a class as a teacher and joining as a student.
 */
test.describe("Class Management", () => {
  const teacherUser = {
    id: "1",
    email: "teacher@example.com",
    firstName: "John",
    lastName: "Doe",
    role: "teacher",
  }

  const studentUser = {
    id: "2",
    email: "student@example.com",
    firstName: "Jane",
    lastName: "Smith",
    role: "student",
  }

  const mockClass = {
    id: 1,
    className: "Introduction to Computer Science",
    classCode: "CS101X",
    teacherId: 1,
    yearLevel: 1,
    semester: 1,
    academicYear: "2024-2025",
    isActive: true,
    studentCount: 0,
    schedule: {
      days: ["Monday", "Wednesday"],
      startTime: "08:00",
      endTime: "09:30",
    },
    createdAt: new Date().toISOString(),
  }
  test.describe("As a Teacher", () => {
    test.beforeEach(async ({ page }) => {
      // Mock auth session
      await page.addInitScript((user) => {
        window.localStorage.setItem("user", JSON.stringify(user))
      }, teacherUser)

      // Mock API calls
      await page.route("**/api/v1/classes/teacher/*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            classes: [],
          }),
        })
      })

      await page.goto("/dashboard/classes")
    })

    test("should navigate to create class page", async ({ page }) => {
      await page.getByRole("button", { name: /create new class/i }).click()
      await expect(page).toHaveURL(/\/dashboard\/classes\/new/)
      await expect(page.getByText(/create new class/i).first()).toBeVisible()
    })

    test("should successfully create a new class", async ({ page }) => {
      // Setup detailed mocks for class creation
      await page.route("**/api/v1/classes/generate-code", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, code: "CS101X" }),
        })
      })

      await page.route("**/api/v1/classes", async (route) => {
        if (route.request().method() === "POST") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, class: mockClass }),
          })
        } else {
          await route.continue()
        }
      })

      // Navigate to creation form
      await page.goto("/dashboard/classes/new")

      // Fill basic info
      await page.locator("#className").fill("Introduction to Computer Science")
      await page.locator("#description").fill("Basic CS principles")

      // Generate code
      await page.getByRole("button", { name: /generate/i }).click()
      await expect(page.locator('input[value="CS101X"]')).toBeVisible()

      // Set schedule (click Monday and Wednesday)
      await page.getByRole("button", { name: "Mon" }).click()
      await page.getByRole("button", { name: "Wed" }).click()

      // Set Academic Period
      await page.locator("#yearLevel").selectOption("1")
      await page.locator("#semester").selectOption("1")
      await page.locator("#academicYear").fill("2024-2025")

      // Mock the list call after creation to show the new class
      await page.route("**/api/v1/classes/teacher/*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            classes: [mockClass],
          }),
        })
      })

      // Submit
      await page.getByRole("button", { name: /create class/i }).click()

      // Verify navigation back to classes list and success toast
      await expect(page).toHaveURL(/\/dashboard\/classes$/)
      await expect(page.getByText(/class created successfully/i)).toBeVisible()
      await expect(
        page.getByText("Introduction to Computer Science"),
      ).toBeVisible()
    })
  })

  test.describe("As a Student", () => {
    test.beforeEach(async ({ page }) => {
      // Mock auth session
      await page.addInitScript((user) => {
        window.localStorage.setItem("user", JSON.stringify(user))
      }, studentUser)

      // Mock initial dashboard data
      await page.route("**/api/v1/student/dashboard/*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            recentClasses: [],
            pendingTasks: [],
          }),
        })
      })

      await page.goto("/dashboard")
    })

    test("should successfully join a class with code", async ({ page }) => {
      // Mock join class API
      await page.route("**/api/v1/student/dashboard/join", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            message: "Successfully joined class",
            classInfo: mockClass,
          }),
        })
      })

      // Mock refreshed dashboard
      await page.route("**/api/v1/student/dashboard/*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            recentClasses: [mockClass],
            pendingTasks: [],
          }),
        })
      })

      // Open join modal
      await page.getByRole("button", { name: /join class/i }).click()

      // Fill code
      await page.locator("#classCode").fill("CS101X")

      // Submit
      await page
        .getByRole("button", { name: /join class/i })
        .filter({ hasText: "Join Class" })
        .click()

      // Verify success
      await expect(page.getByText(/successfully joined class/i)).toBeVisible()
      await expect(
        page.getByText("Introduction to Computer Science"),
      ).toBeVisible()
    })
  })
})
