import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { getCurrentUser } from "@/business/services/authService"
import {
  createAssignment,
  updateAssignment,
  getClassById,
  uploadAssignmentInstructionsImage,
  removeAssignmentInstructionsImage,
} from "@/business/services/classService"
import { getAssignmentById } from "@/business/services/assignmentService"
import { useToast } from "@/presentation/context/ToastContext"
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
import type { PendingTestCase } from "@/presentation/components/teacher/forms/testCases/TestCaseList"
import type { SelectOption } from "@/presentation/components/ui/Select"
import { DEFAULT_LATE_PENALTY_CONFIG } from "@/presentation/components/teacher/forms/assignment/LatePenaltyConfig"
import { toLocalDateTimeString } from "@/presentation/utils/dateUtils"
import { PROGRAMMING_LANGUAGE_OPTIONS } from "@/shared/constants"
import { type ProgrammingLanguage } from "@/business/models/assignment/types"
import type {
  AssignmentFormData,
  FormErrors,
} from "@/presentation/hooks/teacher/assignmentForm.types"
import {
  buildAssignmentPayload,
  normalizeLatePenaltyConfig,
  validateAssignmentFormData,
} from "@/presentation/hooks/teacher/assignmentForm.helpers"

export const programmingLanguageOptions: SelectOption[] =
  PROGRAMMING_LANGUAGE_OPTIONS.map((opt) => ({ ...opt }))

export function useAssignmentForm() {
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
  const [isUploadingInstructionsImage, setIsUploadingInstructionsImage] =
    useState(false)
  const [showTemplateCode, setShowTemplateCode] = useState(false)

  const [formData, setFormData] = useState<AssignmentFormData>({
    assignmentName: "",
    instructions: "",
    instructionsImageUrl: null,
    programmingLanguage: "",
    deadline: "",
    allowResubmission: false,
    maxAttempts: null,
    templateCode: "",
    totalScore: null,
    scheduledDate: null,
    allowLateSubmissions: false,
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
              instructions: assignment.instructions,
              instructionsImageUrl: assignment.instructionsImageUrl ?? null,
              programmingLanguage:
                assignment.programmingLanguage as ProgrammingLanguage,
              deadline: assignment.deadline
                ? toLocalDateTimeString(assignment.deadline)
                : "",
              allowResubmission: assignment.allowResubmission,
              maxAttempts: assignment.maxAttempts ?? null,
              templateCode: assignment.templateCode ?? "",
              totalScore: assignment.totalScore ?? null,
              scheduledDate: assignment.scheduledDate
                ? toLocalDateTimeString(assignment.scheduledDate)
                : null,
              allowLateSubmissions: assignment.deadline
                ? (assignment.allowLateSubmissions ?? false)
                : false,
              latePenaltyConfig: normalizeLatePenaltyConfig(
                assignment.latePenaltyConfig,
              ),
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

  const handleInputChange = <K extends keyof AssignmentFormData>(
    field: K,
    value: AssignmentFormData[K],
  ) => {
    setFormData((prev) => {
      const updatedFormData = { ...prev, [field]: value }

      if (field === "deadline") {
        const hasDeadline =
          typeof value === "string" && value.trim().length > 0

        if (!hasDeadline) {
          updatedFormData.allowLateSubmissions = false
        }
      }

      return updatedFormData
    })
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }))
  }

  const validateForm = (): boolean => {
    const newErrors = validateAssignmentFormData(formData)
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

    if (formData.totalScore === null) {
      setErrors((prev) => ({
        ...prev,
        totalScore: "Total score is required",
      }))
      return
    }

    setIsLoading(true)

    try {
      const assignmentPayload = buildAssignmentPayload(
        formData,
        parseInt(currentUser.id),
      )

      if (isEditMode && assignmentId) {
        // Update existing assignment
        await updateAssignment(parseInt(assignmentId), assignmentPayload)
        showToast("Assignment updated successfully")
      } else {
        // Create new assignment
        const newAssignment = await createAssignment({
          classId: parseInt(classId),
          ...assignmentPayload,
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
            `Assignment created successfully with ${pendingTestCases.length} test case(s)`,
          )
        } else {
          showToast("Assignment created successfully (0 test cases)")
        }
      }
      navigate(`/dashboard/classes/${classId}`)
    } catch {
      setErrors({
        general: `Failed to ${
          isEditMode ? "update" : "create"
        } assignment. Please try again.`,
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

  const handleInstructionsImageUpload = async (file: File) => {
    if (!currentUser?.id || !classId) {
      setErrors({ general: "You must be logged in" })
      return
    }

    setIsUploadingInstructionsImage(true)
    try {
      const previousInstructionsImageUrl = formData.instructionsImageUrl

      const uploadedImageUrl = await uploadAssignmentInstructionsImage(
        parseInt(currentUser.id),
        parseInt(classId, 10),
        file,
      )

      setFormData((prev) => ({
        ...prev,
        instructionsImageUrl: uploadedImageUrl,
      }))
      setErrors((prev) => ({ ...prev, instructions: undefined, general: undefined }))

      if (
        previousInstructionsImageUrl &&
        previousInstructionsImageUrl !== uploadedImageUrl
      ) {
        try {
          await removeAssignmentInstructionsImage(previousInstructionsImageUrl)
        } catch (cleanupError) {
          console.error(
            "Failed to cleanup previous instructions image after successful upload:",
            cleanupError,
          )
        }
      }
    } catch (error) {
      const uploadErrorMessage =
        error instanceof Error
          ? error.message
          : "Failed to upload instructions image"
      setErrors((prev) => ({
        ...prev,
        general: uploadErrorMessage,
      }))
      showToast(uploadErrorMessage, "error")
    } finally {
      setIsUploadingInstructionsImage(false)
    }
  }

  const handleRemoveInstructionsImage = async () => {
    const currentInstructionsImageUrl = formData.instructionsImageUrl

    setFormData((prev) => ({
      ...prev,
      instructionsImageUrl: null,
    }))

    if (!currentInstructionsImageUrl) {
      return
    }

    try {
      await removeAssignmentInstructionsImage(currentInstructionsImageUrl)
    } catch (error) {
      console.error("Failed to remove assignment instructions image:", error)
    }
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
    isUploadingInstructionsImage,
    isEditMode,
    assignmentId,
    showTemplateCode,

    // Actions
    setShowTemplateCode,
    handleInputChange,
    handleInstructionsImageUpload,
    handleRemoveInstructionsImage,
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


