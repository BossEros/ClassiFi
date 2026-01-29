import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { getCurrentUser } from "@/business/services/authService"
import {
  createAssignment,
  updateAssignment,
  getClassById,
} from "@/business/services/classService"
import { getAssignmentById } from "@/business/services/assignmentService"
import { useToast } from "@/shared/context/ToastContext"
import {
  validateAssignmentTitle,
  validateDescription,
  validateProgrammingLanguage,
  validateDeadline,
} from "@/business/validation/assignmentValidation"
import {
  getTestCases,
  createTestCase,
  updateTestCase,
  deleteTestCase,
} from "@/business/services/testCaseService"
import type {
  TestCase,
  CreateTestCaseRequest,
  UpdateTestCaseRequest,
} from "@/shared/types/testCase"
import type { PendingTestCase } from "@/presentation/components/forms/TestCaseList"
import type { SelectOption } from "@/presentation/components/ui/Select"
import type { LatePenaltyConfig } from "@/shared/types/gradebook"
import { DEFAULT_LATE_PENALTY_CONFIG } from "@/presentation/components/forms/coursework/LatePenaltyConfig"
import { toLocalDateTimeString } from "@/shared/utils/dateUtils"
import { PROGRAMMING_LANGUAGE_OPTIONS } from "@/shared/constants"
import { type ProgrammingLanguage } from "@/data/api/types"

export interface CourseworkFormData {
  assignmentName: string
  description: string
  programmingLanguage: ProgrammingLanguage | ""
  deadline: string
  allowResubmission: boolean
  maxAttempts: number | null
  templateCode: string
  totalScore: number
  scheduledDate: string | null
  latePenaltyEnabled: boolean
  latePenaltyConfig: LatePenaltyConfig
}

export interface FormErrors {
  assignmentName?: string
  description?: string
  programmingLanguage?: string
  deadline?: string
  maxAttempts?: string
  general?: string
}

export const programmingLanguageOptions: SelectOption[] =
  PROGRAMMING_LANGUAGE_OPTIONS.map((opt) => ({ ...opt }))

export function useCourseworkForm() {
  const navigate = useNavigate()
  const { classId, assignmentId } = useParams<{
    classId: string
    assignmentId?: string
  }>()
  const { showToast } = useToast()
  const currentUser = getCurrentUser()

  const isEditMode = !!assignmentId

  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(isEditMode)
  const [errors, setErrors] = useState<FormErrors>({})
  const [className, setClassName] = useState("")
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [pendingTestCases, setPendingTestCases] = useState<PendingTestCase[]>(
    [],
  )
  const [isLoadingTestCases, setIsLoadingTestCases] = useState(false)
  const [showTemplateCode, setShowTemplateCode] = useState(false)

  const [formData, setFormData] = useState<CourseworkFormData>({
    assignmentName: "",
    description: "",
    programmingLanguage: "",
    deadline: "",
    allowResubmission: true,
    maxAttempts: null,
    templateCode: "",
    totalScore: 100,
    scheduledDate: null,
    latePenaltyEnabled: false,
    latePenaltyConfig: DEFAULT_LATE_PENALTY_CONFIG,
  })

  // Fetch class name and existing assignment data
  useEffect(() => {
    const fetchData = async () => {
      const user = getCurrentUser()
      if (!user || !classId) return

      setIsFetching(true)
      try {
        // Fetch class name
        const classData = await getClassById(
          parseInt(classId),
          parseInt(user.id),
        )
        setClassName(classData.className)

        // If editing, fetch assignment data
        if (isEditMode && assignmentId) {
          const assignment = await getAssignmentById(
            parseInt(assignmentId),
            parseInt(user.id),
          )
          if (assignment) {
            setFormData({
              assignmentName: assignment.assignmentName,
              description: assignment.description,
              programmingLanguage:
                assignment.programmingLanguage as ProgrammingLanguage,
              deadline: toLocalDateTimeString(assignment.deadline),
              allowResubmission: assignment.allowResubmission,
              maxAttempts: assignment.maxAttempts ?? null,
              templateCode: assignment.templateCode ?? "",
              totalScore: assignment.totalScore ?? 100,
              scheduledDate: assignment.scheduledDate
                ? toLocalDateTimeString(assignment.scheduledDate)
                : null,
              latePenaltyEnabled: assignment.latePenaltyEnabled ?? false,
              latePenaltyConfig:
                assignment.latePenaltyConfig ?? DEFAULT_LATE_PENALTY_CONFIG,
            })
            setShowTemplateCode(!!assignment.templateCode)
          }
        }
      } catch {
        setErrors({ general: "Failed to load data. Please try again." })
      } finally {
        setIsFetching(false)
      }
    }
    fetchData()
  }, [classId, isEditMode, assignmentId])

  // Fetch test cases
  useEffect(() => {
    const fetchTestCases = async () => {
      if (!isEditMode || !assignmentId) return
      setIsLoadingTestCases(true)
      try {
        const fetchedTestCases = await getTestCases(parseInt(assignmentId))
        if (fetchedTestCases) {
          setTestCases(fetchedTestCases)
        }
      } catch (error) {
        console.error("Failed to load test cases:", error)
      } finally {
        setIsLoadingTestCases(false)
      }
    }
    fetchTestCases()
  }, [isEditMode, assignmentId])

  const handleInputChange = <K extends keyof CourseworkFormData>(
    field: K,
    value: CourseworkFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }))
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    const nameError = validateAssignmentTitle(formData.assignmentName)
    if (nameError) newErrors.assignmentName = nameError

    const descError = validateDescription(formData.description)
    if (descError) newErrors.description = descError

    const langError = validateProgrammingLanguage(formData.programmingLanguage)
    if (langError) newErrors.programmingLanguage = langError

    if (!formData.deadline) {
      newErrors.deadline = "Deadline is required"
    } else {
      const deadlineError = validateDeadline(new Date(formData.deadline))
      if (deadlineError) newErrors.deadline = deadlineError
    }

    if (formData.allowResubmission && formData.maxAttempts !== null) {
      if (formData.maxAttempts < 1 || formData.maxAttempts > 99) {
        newErrors.maxAttempts = "Max attempts must be between 1 and 99"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    if (!currentUser?.id || !classId) {
      setErrors({ general: "You must be logged in" })
      return
    }

    setIsLoading(true)

    try {
      if (isEditMode && assignmentId) {
        // Update existing assignment
        await updateAssignment(parseInt(assignmentId), {
          teacherId: parseInt(currentUser.id),
          assignmentName: formData.assignmentName.trim(),
          description: formData.description.trim(),
          programmingLanguage:
            formData.programmingLanguage as ProgrammingLanguage,
          deadline: new Date(formData.deadline),
          allowResubmission: formData.allowResubmission,
          maxAttempts: formData.allowResubmission ? formData.maxAttempts : 1,
          templateCode: formData.templateCode || null,
          totalScore: formData.totalScore,
          scheduledDate: formData.scheduledDate
            ? new Date(formData.scheduledDate)
            : null,
          latePenaltyEnabled: formData.latePenaltyEnabled,
          latePenaltyConfig: formData.latePenaltyEnabled
            ? formData.latePenaltyConfig
            : null,
        })
        showToast("Coursework updated successfully")
      } else {
        // Create new assignment
        const newAssignment = await createAssignment({
          classId: parseInt(classId),
          teacherId: parseInt(currentUser.id),
          assignmentName: formData.assignmentName.trim(),
          description: formData.description.trim(),
          programmingLanguage:
            formData.programmingLanguage as ProgrammingLanguage,
          deadline: new Date(formData.deadline),
          allowResubmission: formData.allowResubmission,
          maxAttempts: formData.allowResubmission ? formData.maxAttempts : 1,
          templateCode: formData.templateCode || null,
          totalScore: formData.totalScore,
          scheduledDate: formData.scheduledDate
            ? new Date(formData.scheduledDate)
            : null,
          latePenaltyEnabled: formData.latePenaltyEnabled,
          latePenaltyConfig: formData.latePenaltyEnabled
            ? formData.latePenaltyConfig
            : null,
        })

        // Create pending test cases
        if (pendingTestCases.length > 0 && newAssignment?.id) {
          for (const pending of pendingTestCases) {
            await createTestCase(newAssignment.id, {
              name: pending.name,
              input: pending.input,
              expectedOutput: pending.expectedOutput,
              isHidden: pending.isHidden,
              timeLimit: pending.timeLimit,
              sortOrder: pending.sortOrder,
            })
          }
          showToast(
            `Coursework created successfully with ${pendingTestCases.length} test case(s)`,
          )
        } else {
          showToast("Coursework created successfully (0 test cases)")
        }
      }
      navigate(`/dashboard/classes/${classId}`)
    } catch {
      setErrors({
        general: `Failed to ${
          isEditMode ? "update" : "create"
        } coursework. Please try again.`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Test case handlers
  const handleAddTestCase = async (data: CreateTestCaseRequest) => {
    if (!assignmentId) return
    try {
      const newTestCase = await createTestCase(parseInt(assignmentId), data)
      if (newTestCase) {
        setTestCases((prev) => [...prev, newTestCase])
        showToast("Test case added")
      }
    } catch (error) {
      console.error("Failed to add test case:", error)
      showToast("Failed to add test case", "error")
    }
  }

  const handleUpdateTestCase = async (
    id: number,
    data: UpdateTestCaseRequest,
  ) => {
    try {
      const updatedTestCase = await updateTestCase(id, data)
      if (updatedTestCase) {
        setTestCases((prev) =>
          prev.map((tc) => (tc.id === id ? updatedTestCase : tc)),
        )
        showToast("Test case updated")
      }
    } catch (error) {
      console.error("Failed to update test case:", error)
      showToast("Failed to update test case", "error")
    }
  }

  const handleDeleteTestCase = async (id: number) => {
    try {
      await deleteTestCase(id)
      setTestCases((prev) => prev.filter((tc) => tc.id !== id))
      showToast("Test case deleted")
    } catch (error) {
      console.error("Failed to delete test case:", error)
      showToast("Failed to delete test case", "error")
    }
  }

  const handleAddPendingTestCase = (data: PendingTestCase) => {
    setPendingTestCases((prev) => [...prev, data])
  }

  const handleUpdatePendingTestCase = (
    tempId: string,
    data: PendingTestCase,
  ) => {
    setPendingTestCases((prev) =>
      prev.map((tc) => (tc.tempId === tempId ? data : tc)),
    )
  }

  const handleDeletePendingTestCase = (tempId: string) => {
    setPendingTestCases((prev) => prev.filter((tc) => tc.tempId !== tempId))
  }

  return {
    // State
    formData,
    errors,
    isLoading,
    isFetching,
    className,
    testCases,
    pendingTestCases,
    isLoadingTestCases,
    isEditMode,
    assignmentId,
    showTemplateCode,

    // Actions
    setShowTemplateCode,
    handleInputChange,
    handleSubmit,

    // Test Case Actions
    handleAddTestCase,
    handleUpdateTestCase,
    handleDeleteTestCase,
    handleAddPendingTestCase,
    handleUpdatePendingTestCase,
    handleDeletePendingTestCase,
  }
}
