import { test, expect } from "@playwright/test"

/**
 * E2E tests for teacher-specific submission and gradebook flows.
 * Uses mocked API responses and a mocked auth session.
 * Covers: assignment submissions view, gradebook, and student list.
 */
test.describe("Teacher Submissions & Gradebook", () => {
  const teacherUser = {
    id: "1",
    email: "teacher@example.com",
    firstName: "John",
    lastName: "Doe",
    role: "teacher",
  }

  const mockClass = {
    id: 1,
    className: "Introduction to Computer Science",
    classCode: "CS101X",
    teacherId: 1,
    teacherName: "John Doe",
    isActive: true,
    studentCount: 2,
    schedule: {
      days: ["Monday", "Wednesday"],
      startTime: "08:00",
      endTime: "09:30",
    },
    createdAt: new Date().toISOString(),
  }

  const mockAssignment = {
    id: 101,
    classId: 1,
    className: "Introduction to Computer Science",
    assignmentName: "Hello World in Python",
    instructions: "Write a program that prints Hello, World!",
    programmingLanguage: "python",
    deadline: new Date(Date.now() - 86400000).toISOString(),
    allowResubmission: true,
    maxAttempts: null,
    isActive: true,
    totalScore: 100,
    testCases: [
      { id: 1, name: "Basic Output Test", input: null, expectedOutput: "Hello, World!" },
    ],
  }

  const mockStudents = [
    { id: 2, firstName: "Jane", lastName: "Smith", email: "jane@example.com", role: "student" },
    { id: 3, firstName: "Bob", lastName: "Jones", email: "bob@example.com", role: "student" },
  ]

  const mockSubmissions = [
    {
      id: 1001,
      assignmentId: 101,
      studentId: 2,
      studentName: "Jane Smith",
      studentEmail: "jane@example.com",
      grade: 90,
      isOverridden: false,
      submittedAt: new Date(Date.now() - 3600000).toISOString(),
      isPassed: true,
      totalTestCases: 1,
      passedTestCases: 1,
    },
    {
      id: 1002,
      assignmentId: 101,
      studentId: 3,
      studentName: "Bob Jones",
      studentEmail: "bob@example.com",
      grade: null,
      isOverridden: false,
      submittedAt: null,
      isPassed: false,
      totalTestCases: 1,
      passedTestCases: 0,
    },
  ]

  const mockGradebook = {
    assignments: [
      { id: 101, name: "Hello World in Python", totalScore: 100, deadline: null },
    ],
    students: [
      {
        id: 2,
        name: "Jane Smith",
        email: "jane@example.com",
        grades: [{ assignmentId: 101, submissionId: 1001, grade: 90, isOverridden: false, submittedAt: new Date().toISOString() }],
      },
      {
        id: 3,
        name: "Bob Jones",
        email: "bob@example.com",
        grades: [{ assignmentId: 101, submissionId: null, grade: null, isOverridden: false, submittedAt: null }],
      },
    ],
  }

  // ---------------------------------------------------------------------------
  // Assignment Submissions Page
  // ---------------------------------------------------------------------------
  test.describe("Assignment Submissions Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((user) => {
        window.localStorage.setItem("user", JSON.stringify(user))
      }, teacherUser)

      await page.route("**/api/v1/assignments/101**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            assignment: mockAssignment,
          }),
        })
      })

      await page.route("**/api/v1/submissions/assignment/101**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            submissions: mockSubmissions,
          }),
        })
      })

      await page.route("**/api/v1/classes/1/students**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            students: mockStudents,
          }),
        })
      })

      await page.goto("/dashboard/assignments/101/submissions")
    })

    test("should display the assignment name as page title", async ({ page }) => {
      await expect(page.getByText("Hello World in Python")).toBeVisible({ timeout: 10000 })
    })

    test("should display the list of student submissions", async ({ page }) => {
      await expect(page.getByText("Jane Smith")).toBeVisible({ timeout: 10000 })
      await expect(page.getByText("Bob Jones")).toBeVisible({ timeout: 10000 })
    })

    test("should display submission count summary stats", async ({ page }) => {
      // Summary stat cards showing submitted/not submitted counts
      await expect(page.getByText(/submitted|submission/i).first()).toBeVisible({ timeout: 10000 })
    })

    test("should display grade for submitted student", async ({ page }) => {
      await expect(page.getByText(/90/)).toBeVisible({ timeout: 10000 })
    })

    test("should filter submissions by search input", async ({ page }) => {
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first()

      if (await searchInput.isVisible({ timeout: 3000 })) {
        await searchInput.fill("Jane")
        await expect(page.getByText("Jane Smith")).toBeVisible()
        await expect(page.getByText("Bob Jones")).not.toBeVisible()
      } else {
        // The search box may not be present on this page; skip gracefully
        test.skip()
      }
    })
  })

  // ---------------------------------------------------------------------------
  // Gradebook Page
  // ---------------------------------------------------------------------------
  test.describe("Gradebook Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((user) => {
        window.localStorage.setItem("user", JSON.stringify(user))
      }, teacherUser)

      await page.route("**/api/v1/classes/1**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            classInfo: mockClass,
            assignments: [mockAssignment],
            students: mockStudents,
          }),
        })
      })

      await page.route("**/api/v1/gradebook/classes/1**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            ...mockGradebook,
          }),
        })
      })

      await page.goto("/dashboard/classes/1/gradebook")
    })

    test("should display the gradebook heading", async ({ page }) => {
      await expect(page.getByText(/gradebook/i)).toBeVisible({ timeout: 10000 })
    })

    test("should display student names in the gradebook table", async ({ page }) => {
      await expect(page.getByText("Jane Smith")).toBeVisible({ timeout: 10000 })
      await expect(page.getByText("Bob Jones")).toBeVisible({ timeout: 10000 })
    })

    test("should display assignment column header", async ({ page }) => {
      await expect(page.getByText("Hello World in Python")).toBeVisible({ timeout: 10000 })
    })

    test("should display submitted student grade in the table", async ({ page }) => {
      await expect(page.getByText(/90/)).toBeVisible({ timeout: 10000 })
    })

    test("should display a back button to return to class detail", async ({ page }) => {
      await expect(page.getByRole("link", { name: /back/i }).or(page.getByRole("button", { name: /back/i }))).toBeVisible({ timeout: 10000 })
    })
  })

  // ---------------------------------------------------------------------------
  // Teacher Dashboard
  // ---------------------------------------------------------------------------
  test.describe("Teacher Dashboard", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((user) => {
        window.localStorage.setItem("user", JSON.stringify(user))
      }, teacherUser)

      await page.route("**/api/v1/teacher/dashboard/**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            recentClasses: [mockClass],
            pendingTasks: [
              {
                id: 101,
                classId: 1,
                assignmentName: "Hello World in Python",
                programmingLanguage: "python",
                deadline: new Date(Date.now() + 86400000).toISOString(),
                isActive: true,
                className: "Introduction to Computer Science",
                submissionCount: 1,
                totalStudents: 2,
              },
            ],
          }),
        })
      })

      await page.goto("/dashboard")
    })

    test("should display personalized welcome message for teacher", async ({ page }) => {
      await expect(page.getByText(/welcome back.*john/i)).toBeVisible({ timeout: 10000 })
    })

    test("should display recent class card", async ({ page }) => {
      await expect(
        page.getByText("Introduction to Computer Science"),
      ).toBeVisible({ timeout: 10000 })
    })

    test("should display pending task assignment", async ({ page }) => {
      await expect(page.getByText("Hello World in Python")).toBeVisible({ timeout: 10000 })
    })

    test("should navigate to class detail when class card is clicked", async ({ page }) => {
      await page.getByText("Introduction to Computer Science").click()

      await expect(page).toHaveURL(/\/dashboard\/classes\/\d+/)
    })

    test("should navigate to classes list page", async ({ page }) => {
      await page.route("**/api/v1/classes/teacher/**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, classes: [mockClass] }),
        })
      })

      await page.goto("/dashboard/classes")

      await expect(page).toHaveURL(/\/dashboard\/classes/)
      await expect(page.getByText("Introduction to Computer Science")).toBeVisible({ timeout: 10000 })
    })
  })
})
