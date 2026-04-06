import { test, expect } from "@playwright/test"

/**
 * E2E tests for student-specific pages and flows.
 * Uses mocked API responses and a mocked auth session.
 * Covers: dashboard, grades, tasks, history, and assignment detail views.
 */
test.describe("Student Dashboard & Pages", () => {
  const studentUser = {
    id: "2",
    email: "student@example.com",
    firstName: "Jane",
    lastName: "Smith",
    role: "student",
  }

  const mockEnrolledClass = {
    id: 1,
    className: "Introduction to Computer Science",
    classCode: "CS101X",
    teacherId: 1,
    teacherName: "John Doe",
    isActive: true,
    studentCount: 15,
    schedule: {
      days: ["Monday", "Wednesday"],
      startTime: "08:00",
      endTime: "09:30",
    },
    createdAt: new Date().toISOString(),
  }

  const mockPendingAssignment = {
    id: 101,
    classId: 1,
    className: "Introduction to Computer Science",
    assignmentName: "Hello World in Python",
    programmingLanguage: "python",
    deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
    isActive: true,
    totalScore: 100,
  }

  const mockAssignmentDetail = {
    id: 101,
    classId: 1,
    assignmentName: "Hello World in Python",
    instructions: "Write a program that prints Hello, World!",
    programmingLanguage: "python",
    deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
    allowResubmission: true,
    maxAttempts: null,
    isActive: true,
    totalScore: 100,
    testCases: [
      { id: 1, name: "Basic Output Test", input: null, expectedOutput: "Hello, World!" },
    ],
    submission: null,
  }

  const mockStudentGrades = [
    {
      classId: 1,
      className: "Introduction to Computer Science",
      teacherName: "John Doe",
      assignments: [
        {
          assignmentId: 101,
          assignmentName: "Hello World in Python",
          totalScore: 100,
          deadline: new Date(Date.now() - 86400000).toISOString(),
          grade: 85,
          gradeBreakdown: {
            originalGrade: 85,
            latePenaltyPercent: 0,
            similarityPenaltyPercent: 0,
            similarityScore: null,
            finalGrade: 85,
            effectiveGrade: 85,
            isOverridden: false,
          },
          isOverridden: false,
          feedback: "Good work!",
          submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          isLate: false,
          penaltyApplied: 0,
        },
      ],
    },
  ]

  test.describe("Student Dashboard", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((user) => {
        window.localStorage.setItem("user", JSON.stringify(user))
      }, studentUser)

      await page.route("**/api/v1/student/dashboard/**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            enrolledClasses: [mockEnrolledClass],
            pendingAssignments: [mockPendingAssignment],
          }),
        })
      })

      await page.goto("/dashboard")
    })

    test("should display personalized welcome message", async ({ page }) => {
      await expect(page.getByText(/welcome back.*jane/i)).toBeVisible({ timeout: 10000 })
    })

    test("should display enrolled class card", async ({ page }) => {
      await expect(
        page.getByText("Introduction to Computer Science"),
      ).toBeVisible({ timeout: 10000 })
    })

    test("should display pending assignment", async ({ page }) => {
      await expect(page.getByText("Hello World in Python")).toBeVisible({ timeout: 10000 })
    })

    test("should navigate to class detail when class card is clicked", async ({ page }) => {
      await page.getByText("Introduction to Computer Science").click()

      await expect(page).toHaveURL(/\/dashboard\/classes\/\d+/)
    })
  })

  // ---------------------------------------------------------------------------
  // Student Grades Page
  // ---------------------------------------------------------------------------
  test.describe("Student Grades Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((user) => {
        window.localStorage.setItem("user", JSON.stringify(user))
      }, studentUser)

      await page.route("**/api/v1/gradebook/students/**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            grades: mockStudentGrades,
          }),
        })
      })

      await page.goto("/dashboard/grades")
    })

    test("should display the grades page header", async ({ page }) => {
      await expect(page.getByRole("heading", { name: /grades|my grades/i })).toBeVisible({ timeout: 10000 })
    })

    test("should display class name in grades view", async ({ page }) => {
      await expect(
        page.getByText("Introduction to Computer Science"),
      ).toBeVisible({ timeout: 10000 })
    })

    test("should display assignment name in grades list", async ({ page }) => {
      await expect(page.getByText("Hello World in Python")).toBeVisible({ timeout: 10000 })
    })

    test("should display the grade score for the assignment", async ({ page }) => {
      await expect(page.getByText(/85/)).toBeVisible({ timeout: 10000 })
    })
  })

  // ---------------------------------------------------------------------------
  // Student Tasks Page
  // ---------------------------------------------------------------------------
  test.describe("Student Tasks Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((user) => {
        window.localStorage.setItem("user", JSON.stringify(user))
      }, studentUser)

      await page.goto("/dashboard/tasks")
    })

    test("should display the tasks page heading", async ({ page }) => {
      await expect(page.getByRole("heading", { name: /all tasks/i })).toBeVisible({ timeout: 10000 })
    })

    test("should display tasks placeholder content", async ({ page }) => {
      await expect(page.getByText(/tasks listing coming soon/i)).toBeVisible({ timeout: 10000 })
    })
  })

  // ---------------------------------------------------------------------------
  // Student History Page
  // ---------------------------------------------------------------------------
  test.describe("Student History Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((user) => {
        window.localStorage.setItem("user", JSON.stringify(user))
      }, studentUser)

      await page.goto("/dashboard/history")
    })

    test("should display the analysis history heading", async ({ page }) => {
      await expect(page.getByRole("heading", { name: /analysis history/i })).toBeVisible({ timeout: 10000 })
    })

    test("should display history placeholder content", async ({ page }) => {
      await expect(page.getByText(/analysis history coming soon/i)).toBeVisible({ timeout: 10000 })
    })
  })

  // ---------------------------------------------------------------------------
  // Assignment Detail Page (student view)
  // ---------------------------------------------------------------------------
  test.describe("Assignment Detail Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((user) => {
        window.localStorage.setItem("user", JSON.stringify(user))
      }, studentUser)

      await page.route("**/api/v1/assignments/101**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            assignment: mockAssignmentDetail,
          }),
        })
      })

      await page.goto("/dashboard/assignments/101")
    })

    test("should display assignment name", async ({ page }) => {
      await expect(page.getByText("Hello World in Python")).toBeVisible({ timeout: 10000 })
    })

    test("should display programming language", async ({ page }) => {
      await expect(page.getByText(/python/i)).toBeVisible({ timeout: 10000 })
    })

    test("should display test cases section", async ({ page }) => {
      await expect(page.getByText(/test case/i)).toBeVisible({ timeout: 10000 })
    })

    test("should display file upload area for submission", async ({ page }) => {
      await expect(page.locator('input[type="file"]')).toBeAttached({ timeout: 10000 })
    })
  })

  // ---------------------------------------------------------------------------
  // Protected Route — Unauthenticated redirect
  // ---------------------------------------------------------------------------
  test.describe("Authentication Guard", () => {
    test("should redirect unauthenticated user from dashboard to login", async ({ page }) => {
      await page.goto("/dashboard")

      await expect(page).toHaveURL(/\/login/)
    })

    test("should redirect unauthenticated user from grades page to login", async ({ page }) => {
      await page.goto("/dashboard/grades")

      await expect(page).toHaveURL(/\/login/)
    })
  })
})
