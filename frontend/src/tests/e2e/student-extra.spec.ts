import { test, expect } from "@playwright/test"

/**
 * E2E tests for student-specific flows not covered elsewhere:
 * - Student classes list page
 * - Student class detail page
 * - Assignments list page (student view)
 */
test.describe("Student Extra Flows", () => {
  const studentUser = {
    id: "2",
    email: "student@example.com",
    firstName: "Jane",
    lastName: "Smith",
    role: "student",
  }

  const mockClass = {
    id: 1,
    name: "Introduction to Computer Science",
    description: "Learn programming basics",
    teacherName: "John Doe",
    classCode: "CS101X",
    semester: 1,
    academicYear: "2025-2026",
    schedule: {
      days: ["Monday", "Wednesday"],
      startTime: "08:00",
      endTime: "09:30",
    },
    studentCount: 25,
    isArchived: false,
  }

  const mockAssignment = {
    id: 101,
    title: "Hello World in Python",
    programmingLanguage: "python",
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
    status: "active",
    submissionCount: 10,
    totalStudents: 25,
    isLate: false,
  }

  const mockDashboardResponse = {
    success: true,
    data: {
      classes: [mockClass],
      pendingAssignments: [
        {
          id: 101,
          title: "Hello World in Python",
          className: "Introduction to Computer Science",
          dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
          programmingLanguage: "python",
          submitted: false,
        },
      ],
    },
  }

  // ---------------------------------------------------------------------------
  // Student Classes List Page
  // ---------------------------------------------------------------------------
  test.describe("Student Classes List Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((user) => {
        window.localStorage.setItem("user", JSON.stringify(user))
      }, studentUser)

      await page.route("**/api/v1/student/dashboard/**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockDashboardResponse),
        })
      })

      await page.goto("/dashboard/classes")
    })

    test("should display the classes page heading", async ({ page }) => {
      await expect(page.getByText(/classes|my classes/i)).toBeVisible({ timeout: 10000 })
    })

    test("should display enrolled class card", async ({ page }) => {
      await expect(
        page.getByText("Introduction to Computer Science"),
      ).toBeVisible({ timeout: 10000 })
    })

    test("should display a button to join a class", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: /join.*class|enroll/i }),
      ).toBeVisible({ timeout: 10000 })
    })

    test("should redirect unauthenticated user to login", async ({ page: anonPage }) => {
      await anonPage.goto("/dashboard/classes")

      await expect(anonPage).toHaveURL(/\/login/)
    })
  })

  // ---------------------------------------------------------------------------
  // Student Class Detail Page
  // ---------------------------------------------------------------------------
  test.describe("Student Class Detail Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((user) => {
        window.localStorage.setItem("user", JSON.stringify(user))
      }, studentUser)

      await page.route("**/api/v1/classes/1**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            class: mockClass,
            assignments: [mockAssignment],
            students: [
              { id: 2, firstName: "Jane", lastName: "Smith", email: "student@example.com" },
            ],
          }),
        })
      })

      await page.route("**/api/v1/classes/1/assignments**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, assignments: [mockAssignment] }),
        })
      })

      await page.route("**/api/v1/classes/1/students**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, students: [] }),
        })
      })

      await page.route("**/api/v1/classes/1/modules**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, modules: [] }),
        })
      })

      await page.goto("/dashboard/classes/1")
    })

    test("should display the class name", async ({ page }) => {
      await expect(
        page.getByText("Introduction to Computer Science"),
      ).toBeVisible({ timeout: 10000 })
    })

    test("should display navigation tabs for assignments", async ({ page }) => {
      await expect(
        page.getByRole("tab", { name: /assignments?/i }).or(
          page.getByText(/assignments?/i),
        ),
      ).toBeVisible({ timeout: 10000 })
    })

    test("should display the assignment in the list", async ({ page }) => {
      await expect(
        page.getByText("Hello World in Python"),
      ).toBeVisible({ timeout: 10000 })
    })
  })

  // ---------------------------------------------------------------------------
  // Assignments List Page (Student View)
  // ---------------------------------------------------------------------------
  test.describe("Assignments List Page – Student", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((user) => {
        window.localStorage.setItem("user", JSON.stringify(user))
      }, studentUser)

      await page.route("**/api/v1/student/dashboard/**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockDashboardResponse),
        })
      })

      await page.goto("/dashboard/assignments")
    })

    test("should display the assignments page", async ({ page }) => {
      await expect(page.getByText(/assignments?/i)).toBeVisible({ timeout: 10000 })
    })

    test("should display assignment from the list", async ({ page }) => {
      await expect(
        page.getByText("Hello World in Python"),
      ).toBeVisible({ timeout: 10000 })
    })

    test("should redirect unauthenticated user to login", async ({ page: anonPage }) => {
      await anonPage.goto("/dashboard/assignments")

      await expect(anonPage).toHaveURL(/\/login/)
    })
  })
})
