import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useAssignmentForm } from "@/presentation/hooks/useAssignmentForm"
import * as authService from "@/business/services/authService"
import * as classService from "@/business/services/classService"
import * as assignmentService from "@/business/services/assignmentService"
import * as testCaseService from "@/business/services/testCaseService"
import { ToastProvider } from "@/presentation/context/ToastContext"
import { MemoryRouter } from "react-router-dom"
import type { User } from "@/shared/types/auth"
import type { ISODateString } from "@/shared/types/class"
import { DEFAULT_LATE_PENALTY_CONFIG } from "@/presentation/components/forms/assignment/LatePenaltyConfig"

// Mock dependencies
vi.mock("@/business/services/authService")
vi.mock("@/business/services/classService")
vi.mock("@/business/services/assignmentService")
vi.mock("@/business/services/testCaseService")

// Mock LatePenaltyConfig to avoid importing UI component
vi.mock("@/presentation/components/forms/assignment/LatePenaltyConfig", () => ({
  DEFAULT_LATE_PENALTY_CONFIG: {
    tiers: [],
    rejectAfterHours: 120,
  },
}))

// Mock validation to separate concerns
vi.mock("@/business/validation/assignmentValidation", () => ({
  validateAssignmentTitle: vi.fn(),
  validateInstructions: vi.fn(),
  validateProgrammingLanguage: vi.fn(),
  validateDeadline: vi.fn(),
}))

const mockUser: User = {
  id: "1",
  email: "teacher@example.com",
  firstName: "Teacher",
  lastName: "One",
  role: "teacher",
  createdAt: new Date(),
}

// Mock params and navigate
const mockNavigate = vi.fn()
const mockParams = {
  classId: "101",
  assignmentId: undefined as string | undefined,
}

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  }
})

describe("useAssignmentForm", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ToastProvider>
      <MemoryRouter>{children}</MemoryRouter>
    </ToastProvider>
  )

  beforeEach(async () => {
    vi.resetAllMocks() // Reset all mocks to clear implementations

    // Re-setup global mocks
    vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser)
    mockParams.classId = "101"
    mockParams.assignmentId = undefined

    // Default service mocks
    vi.mocked(classService.getClassById).mockResolvedValue({
      id: 101,
      className: "Test Class",
      classCode: "CODE123",
      teacherId: 1,
      description: "Desc",
      isActive: true,
      createdAt: new Date().toISOString() as ISODateString,
      yearLevel: 10,
      semester: 1,
      academicYear: "2023-2024",
      schedule: {
        days: ["monday"],
        startTime: "09:00",
        endTime: "10:00",
      },
    })

    // Default validation mocks
    const {
      validateAssignmentTitle,
      validateInstructions,
      validateProgrammingLanguage,
      validateDeadline,
    } = await import("@/business/validation/assignmentValidation")

    vi.mocked(validateAssignmentTitle).mockReturnValue(null)
    vi.mocked(validateInstructions).mockReturnValue(null)
    vi.mocked(validateProgrammingLanguage).mockReturnValue(null)
    vi.mocked(validateDeadline).mockReturnValue(null)
  })

  describe("Initialization", () => {
    it("should initialize with default values in create mode", async () => {
      const { result } = renderHook(() => useAssignmentForm(), { wrapper })

      await waitFor(() => {
        expect(result.current.className).toBe("Test Class")
      })

      expect(result.current.formData.assignmentName).toBe("")
      expect(result.current.formData.programmingLanguage).toBe("")
      expect(result.current.formData.allowResubmission).toBe(false)
      expect(result.current.formData.totalScore).toBeNull()
      expect(result.current.isEditMode).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })

    it("should fetch assignment data in edit mode", async () => {
      mockParams.assignmentId = "202"
      const mockAssignment = {
        id: 202,
        classId: 101,
        teacherId: 1,
        assignmentName: "Existing Assignment",
        instructions: "Existing Instructions",
        programmingLanguage: "python",
        deadline: new Date("2024-12-31T23:59:00Z"),
        allowResubmission: true,
        maxAttempts: 3,
        templateCode: "print('Hello')",
        totalScore: 100,
        createdAt: new Date(),
        status: "published",
        scheduledDate: null,
        allowLateSubmissions: true,
        latePenaltyConfig: DEFAULT_LATE_PENALTY_CONFIG,
      }

      vi.mocked(assignmentService.getAssignmentById).mockResolvedValue(
        mockAssignment as any,
      )
      vi.mocked(testCaseService.getTestCases).mockResolvedValue([])

      const { result } = renderHook(() => useAssignmentForm(), { wrapper })

      expect(result.current.isFetching).toBe(true)

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false)
      })

      expect(result.current.formData.assignmentName).toBe("Existing Assignment")
      expect(result.current.formData.programmingLanguage).toBe("python")
      expect(result.current.formData.deadline).toBeDefined()
    })
  })

  describe("Form Submission (Create)", () => {
    it("should create assignment and navigate on success", async () => {
      const { result } = renderHook(() => useAssignmentForm(), { wrapper })

      await waitFor(() => expect(result.current.className).toBe("Test Class"))

      act(() => {
        result.current.handleInputChange("assignmentName", "New Assignment")
        result.current.handleInputChange("instructions", "Desc")
        result.current.handleInputChange("programmingLanguage", "python")
        result.current.handleInputChange("deadline", "2024-12-31T23:59")
        result.current.handleInputChange("totalScore", 100)
      })

      const mockCreatedAssignment = { id: 303 }
      vi.mocked(classService.createAssignment).mockResolvedValue(
        mockCreatedAssignment as any,
      )

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any)
      })

      expect(classService.createAssignment).toHaveBeenCalledWith(
        expect.objectContaining({
          assignmentName: "New Assignment",
          classId: 101,
          teacherId: 1,
        }),
      )
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/classes/101")
    })

    it("should prevent submission if validation fails", async () => {
      const { validateAssignmentTitle } =
        await import("@/business/validation/assignmentValidation")
      vi.mocked(validateAssignmentTitle).mockReturnValue("Title required")

      const { result } = renderHook(() => useAssignmentForm(), { wrapper })
      await waitFor(() => expect(result.current.className).toBe("Test Class"))

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any)
      })

      expect(result.current.errors.assignmentName).toBe("Title required")
      expect(classService.createAssignment).not.toHaveBeenCalled()
    })

    it("should prevent submission when release date is set without release time", async () => {
      const { result } = renderHook(() => useAssignmentForm(), { wrapper })

      await waitFor(() => expect(result.current.className).toBe("Test Class"))

      act(() => {
        result.current.handleInputChange("assignmentName", "Scheduled Assignment")
        result.current.handleInputChange("instructions", "Desc")
        result.current.handleInputChange("programmingLanguage", "python")
        result.current.handleInputChange("totalScore", 100)
        result.current.handleInputChange("scheduledDate", "2026-01-01")
      })

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any)
      })

      expect(result.current.errors.scheduledDate).toBe("Release time is required")
      expect(classService.createAssignment).not.toHaveBeenCalled()
    })

    it("should disable late submissions when deadline is cleared", async () => {
      const { result } = renderHook(() => useAssignmentForm(), { wrapper })
      await waitFor(() => expect(result.current.className).toBe("Test Class"))

      act(() => {
        result.current.handleInputChange("deadline", "2026-12-31T23:59")
        result.current.handleInputChange("allowLateSubmissions", true)
      })

      expect(result.current.formData.allowLateSubmissions).toBe(true)

      act(() => {
        result.current.handleInputChange("deadline", "")
      })

      expect(result.current.formData.allowLateSubmissions).toBe(false)
    })

    it("should send late penalty as disabled when deadline is empty", async () => {
      const { result } = renderHook(() => useAssignmentForm(), { wrapper })
      await waitFor(() => expect(result.current.className).toBe("Test Class"))

      act(() => {
        result.current.handleInputChange("assignmentName", "No Deadline Assignment")
        result.current.handleInputChange("instructions", "Desc")
        result.current.handleInputChange("programmingLanguage", "python")
        result.current.handleInputChange("totalScore", 100)
        result.current.handleInputChange("allowLateSubmissions", true)
      })

      vi.mocked(classService.createAssignment).mockResolvedValue({ id: 303 } as any)

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any)
      })

      expect(classService.createAssignment).toHaveBeenCalledWith(
        expect.objectContaining({
          deadline: null,
          allowLateSubmissions: false,
          latePenaltyConfig: null,
        }),
      )
    })
  })

  describe("Test Case Management", () => {
    it("should add pending test case in create mode", async () => {
      const { result } = renderHook(() => useAssignmentForm(), { wrapper })

      const newTestCase = {
        tempId: "temp-1",
        name: "Test 1",
        input: "input",
        expectedOutput: "output",
        isHidden: false,
        timeLimit: 1,
        sortOrder: 1,
      }

      act(() => {
        result.current.handleAddPendingTestCase(newTestCase)
      })

      await waitFor(() => {
        expect(result.current.pendingTestCases).toHaveLength(1)
      })
      expect(result.current.pendingTestCases[0]).toEqual(newTestCase)
    })

    it("should call createTestCase with new assignment ID after creation", async () => {
      const { result } = renderHook(() => useAssignmentForm(), { wrapper })
      await waitFor(() => expect(result.current.className).toBe("Test Class"))

      act(() => {
        result.current.handleInputChange("assignmentName", "With Tests")
        result.current.handleInputChange("deadline", "2024-12-31T23:59")
        result.current.handleInputChange("totalScore", 100)
        result.current.handleAddPendingTestCase({
          tempId: "t1",
          name: "TC1",
          input: "in",
          expectedOutput: "out",
          isHidden: false,
          timeLimit: 1,
          sortOrder: 1,
        })
      })

      vi.mocked(classService.createAssignment).mockResolvedValue({
        id: 999,
      } as any)

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any)
      })

      await waitFor(() => {
        expect(classService.createAssignment).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(testCaseService.createTestCase).toHaveBeenCalledWith(
          999,
          expect.objectContaining({
            name: "TC1",
          }),
        )
      })
    })
  })

  describe("Form Submission (Edit)", () => {
    it("should update assignment and navigate on success", async () => {
      mockParams.assignmentId = "202"
      vi.mocked(assignmentService.getAssignmentById).mockResolvedValue({
        id: 202,
        classId: 101,
        teacherId: 1,
        assignmentName: "Old Name",
        instructions: "Old Instructions",
        programmingLanguage: "python",
        deadline: new Date().toISOString() as ISODateString,
        allowResubmission: true,
        maxAttempts: 3,
        templateCode: "",
        totalScore: 100,
        createdAt: new Date().toISOString() as ISODateString,
        status: "published",
        scheduledDate: null,
        allowLateSubmissions: false,
        latePenaltyConfig: null,
      } as any)
      vi.mocked(testCaseService.getTestCases).mockResolvedValue([])
      vi.mocked(classService.updateAssignment).mockResolvedValue({} as any) // Mock void/result

      const { result } = renderHook(() => useAssignmentForm(), { wrapper })
      await waitFor(() => expect(result.current.isFetching).toBe(false))

      act(() => {
        result.current.handleInputChange("assignmentName", "Updated Name")
      })

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any)
      })

      expect(classService.updateAssignment).toHaveBeenCalledWith(
        202,
        expect.objectContaining({
          assignmentName: "Updated Name",
        }),
      )
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/classes/101")
    })
  })
})
