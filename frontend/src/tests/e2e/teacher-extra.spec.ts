import { test, expect } from "@playwright/test"

/**
 * E2E tests for teacher flows not covered in teacher-submissions.spec.ts:
 * - Teacher class detail page
 * - Edit class form
 * - Create and edit assignment form
 * - Assignments list page (teacher view)
 * - Similarity results page
 * - Cross-class similarity page
 */
test.describe("Teacher Extra Flows", () => {
  const teacherUser = {
    id: "1",
    email: "teacher@example.com",
    firstName: "John",
    lastName: "Doe",
    role: "teacher",
  }

  const mockClass = {
    id: 1,
    name: "Introduction to Computer Science",
    description: "Learn programming basics",
    teacherName: "John Doe",
    teacherId: 1,
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
    classId: 1,
    className: "Introduction to Computer Science",
    maxScore: 100,
    allowLateSubmissions: false,
    testCases: [{ id: 1, input: "5\n3", expectedOutput: "8", isPublic: true }],
  }

  const mockPendingTasksResponse = {
    success: true,
    data: {
      recentClasses: [mockClass],
      pendingTasks: [
        {
          id: 101,
          title: "Hello World in Python",
          className: "Introduction to Computer Science",
          dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
          submitted: 10,
          total: 25,
        },
      ],
    },
  }

  function setupClassDetailMocks(page: import("@playwright/test").Page) {
    return Promise.all([
      page.route("**/api/v1/classes/1**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            class: mockClass,
            assignments: [mockAssignment],
            students: [
              { id: 3, firstName: "Alice", lastName: "Johnson", email: "alice@example.com" },
              { id: 4, firstName: "Bob", lastName: "Williams", email: "bob@example.com" },
            ],
          }),
        })
      }),
      page.route("**/api/v1/classes/1/assignments**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, assignments: [mockAssignment] }),
        })
      }),
      page.route("**/api/v1/classes/1/students**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            students: [
              { id: 3, firstName: "Alice", lastName: "Johnson", email: "alice@example.com" },
              { id: 4, firstName: "Bob", lastName: "Williams", email: "bob@example.com" },
            ],
          }),
        })
      }),
      page.route("**/api/v1/classes/1/modules**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, modules: [] }),
        })
      }),
    ])
  }

  // ---------------------------------------------------------------------------
  // Teacher Class Detail Page
  // ---------------------------------------------------------------------------
  test.describe("Teacher Class Detail Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((user) => {
        window.localStorage.setItem("user", JSON.stringify(user))
      }, teacherUser)

      await setupClassDetailMocks(page)
      await page.goto("/dashboard/classes/1")
    })

    test("should display the class name", async ({ page }) => {
      await expect(
        page.getByText("Introduction to Computer Science"),
      ).toBeVisible({ timeout: 10000 })
    })

    test("should show assignment tabs navigation", async ({ page }) => {
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

    test("should display a students tab", async ({ page }) => {
      await expect(
        page.getByRole("tab", { name: /students?/i }).or(
          page.getByText(/students?/i),
        ),
      ).toBeVisible({ timeout: 10000 })
    })
  })

  // ---------------------------------------------------------------------------
  // Edit Class Form
  // ---------------------------------------------------------------------------
  test.describe("Edit Class Form", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((user) => {
        window.localStorage.setItem("user", JSON.stringify(user))
      }, teacherUser)

      await page.route("**/api/v1/classes/1**", async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, class: mockClass }),
          })
        } else {
          await route.continue()
        }
      })

      await page.goto("/dashboard/classes/1/edit")
    })

    test("should display the edit class form", async ({ page }) => {
      await expect(
        page.getByText(/edit.*class|class.*settings|update.*class/i),
      ).toBeVisible({ timeout: 10000 })
    })

    test("should display class name input field", async ({ page }) => {
      const classNameInput = page.locator("#className").or(
        page.getByPlaceholder(/class name/i),
      )

      await expect(classNameInput).toBeVisible({ timeout: 10000 })
    })

    test("should pre-fill the class name with existing value", async ({ page }) => {
      const classNameInput = page.locator("#className").or(
        page.getByPlaceholder(/class name/i),
      )

      await expect(classNameInput).toHaveValue(/introduction to computer science/i, {
        timeout: 10000,
      })
    })

    test("should display submit button", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: /save|update|submit/i }),
      ).toBeVisible({ timeout: 10000 })
    })
  })

  // ---------------------------------------------------------------------------
  // Create Assignment Form
  // ---------------------------------------------------------------------------
  test.describe("Create Assignment Form", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((user) => {
        window.localStorage.setItem("user", JSON.stringify(user))
      }, teacherUser)

      await page.route("**/api/v1/classes/1**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, class: mockClass }),
        })
      })

      await page.route("**/api/v1/classes/1/modules**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, modules: [] }),
        })
      })

      await page.goto("/dashboard/classes/1/assignments/new")
    })

    test("should display the assignment form", async ({ page }) => {
      await expect(
        page.getByText(/create.*assignment|new.*assignment|assignment.*form/i),
      ).toBeVisible({ timeout: 10000 })
    })

    test("should display assignment title input field", async ({ page }) => {
      const titleInput = page.locator("#title").or(
        page.getByPlaceholder(/assignment.*title|title/i),
      )

      await expect(titleInput).toBeVisible({ timeout: 10000 })
    })

    test("should display programming language selector", async ({ page }) => {
      await expect(
        page.getByText(/programming language|language/i),
      ).toBeVisible({ timeout: 10000 })
    })

    test("should display add test case button", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: /add.*test case|test case/i }),
      ).toBeVisible({ timeout: 10000 })
    })
  })

  // ---------------------------------------------------------------------------
  // Edit Assignment Form
  // ---------------------------------------------------------------------------
  test.describe("Edit Assignment Form", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((user) => {
        window.localStorage.setItem("user", JSON.stringify(user))
      }, teacherUser)

      await page.route("**/api/v1/assignments/101**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, assignment: mockAssignment }),
        })
      })

      await page.route("**/api/v1/classes/1/modules**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, modules: [] }),
        })
      })

      await page.route("**/api/v1/classes/1**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, class: mockClass }),
        })
      })

      await page.goto("/dashboard/classes/1/assignments/101/edit")
    })

    test("should display the assignment form in edit mode", async ({ page }) => {
      await expect(
        page.getByText(/edit.*assignment|update.*assignment/i),
      ).toBeVisible({ timeout: 10000 })
    })

    test("should pre-fill the assignment title", async ({ page }) => {
      const titleInput = page.locator("#title").or(
        page.getByPlaceholder(/assignment.*title|title/i),
      )

      await expect(titleInput).toHaveValue(/hello world in python/i, {
        timeout: 10000,
      })
    })
  })

  // ---------------------------------------------------------------------------
  // Assignments List Page (Teacher View)
  // ---------------------------------------------------------------------------
  test.describe("Assignments List Page – Teacher", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((user) => {
        window.localStorage.setItem("user", JSON.stringify(user))
      }, teacherUser)

      await page.route("**/api/v1/teacher/dashboard/**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockPendingTasksResponse),
        })
      })

      await page.goto("/dashboard/assignments")
    })

    test("should display the assignments page", async ({ page }) => {
      await expect(page.getByText(/assignments?/i)).toBeVisible({ timeout: 10000 })
    })

    test("should display assignment in the list", async ({ page }) => {
      await expect(
        page.getByText("Hello World in Python"),
      ).toBeVisible({ timeout: 10000 })
    })
  })

  // ---------------------------------------------------------------------------
  // Similarity Results Page
  // ---------------------------------------------------------------------------
  test.describe("Similarity Results Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((user) => {
        window.localStorage.setItem("user", JSON.stringify(user))
      }, teacherUser)

      await page.route("**/api/v1/assignments/101**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, assignment: mockAssignment }),
        })
      })

      await page.route("**/api/v1/plagiarism/**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, pairs: [], threshold: 70 }),
        })
      })

      await page.goto("/dashboard/assignments/101/similarity")
    })

    test("should display the similarity results page without redirecting", async ({ page }) => {
      // Page should not redirect to /login since user is authenticated
      await page.waitForTimeout(1000)

      expect(page.url()).not.toContain("/login")
    })

    test("should display the assignment name or similarity heading", async ({ page }) => {
      await expect(
        page.getByText(/similarity|plagiarism|hello world in python/i),
      ).toBeVisible({ timeout: 10000 })
    })

    test("should display an analyze or run button", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: /analyze|run|detect|check/i }).or(
          page.getByText(/analyze|run analysis|no.*results/i),
        ),
      ).toBeVisible({ timeout: 10000 })
    })
  })

  // ---------------------------------------------------------------------------
  // Cross-Class Similarity Page
  // ---------------------------------------------------------------------------
  test.describe("Cross-Class Similarity Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((user) => {
        window.localStorage.setItem("user", JSON.stringify(user))
      }, teacherUser)

      await page.route("**/api/v1/assignments/101**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, assignment: mockAssignment }),
        })
      })

      await page.goto("/dashboard/assignments/101/cross-class-similarity")
    })

    test("should display the cross-class similarity page without redirecting", async ({ page }) => {
      await page.waitForTimeout(1000)

      expect(page.url()).not.toContain("/login")
    })

    test("should display cross-class similarity heading or assignment name", async ({ page }) => {
      await expect(
        page.getByText(/cross.?class|similarity|hello world in python/i),
      ).toBeVisible({ timeout: 10000 })
    })

    test("should display an action button to run cross-class analysis", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: /analyze|run|detect|compare/i }).or(
          page.getByText(/analyze|run|no.*results/i),
        ),
      ).toBeVisible({ timeout: 10000 })
    })
  })
})
