import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { getCurrentUser } from "@/business/services/authService"
import {
  createAssignment,
  updateAssignment,
  getClassById,
  uploadAssignmentDescriptionImage,
  removeAssignmentDescriptionImage,
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
import type {
  LatePenaltyConfig,
  PenaltyTier,
} from "@/shared/types/gradebook"
import { DEFAULT_LATE_PENALTY_CONFIG } from "@/presentation/components/forms/assignment/LatePenaltyConfig"
import { toLocalDateTimeString } from "@/shared/utils/dateUtils"
import { PROGRAMMING_LANGUAGE_OPTIONS } from "@/shared/constants"
import { type ProgrammingLanguage } from "@/data/api/types"

export interface AssignmentFormData {
  assignmentName: string
  description: string
  descriptionImageUrl: string | null
  descriptionImageAlt: string
  programmingLanguage: ProgrammingLanguage | ""
  deadline: string
  allowResubmission: boolean
  maxAttempts: number | null
  templateCode: string
  totalScore: number | null
  scheduledDate: string | null
  latePenaltyEnabled: boolean
  latePenaltyConfig: LatePenaltyConfig
}

export interface FormErrors {
  assignmentName?: string
  description?: string
  programmingLanguage?: string
  deadline?: string
  scheduledDate?: string
  totalScore?: string
  maxAttempts?: string
  general?: string
}

export const programmingLanguageOptions: SelectOption[] =
  PROGRAMMING_LANGUAGE_OPTIONS.map((opt) => ({ ...opt }))

function generateTierId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID()
  }

  return `tier-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeLatePenaltyConfig(
  latePenaltyConfig: LatePenaltyConfig | null | undefined,
): LatePenaltyConfig {
  const sourceConfig = latePenaltyConfig ?? DEFAULT_LATE_PENALTY_CONFIG

  const normalizedTiers: PenaltyTier[] = sourceConfig.tiers.map((tier) => {
    const tierWithOptionalId = tier as PenaltyTier & { id?: string }
    const tierWithLegacyHours = tier as PenaltyTier & {
      hoursAfterGrace?: number
    }
    const hasValidId =
      typeof tierWithOptionalId.id === "string" &&
      tierWithOptionalId.id.trim().length > 0
    const tierHoursLate =
      typeof tier.hoursLate === "number"
        ? tier.hoursLate
        : (tierWithLegacyHours.hoursAfterGrace ?? 0)

    return {
      id: hasValidId ? tierWithOptionalId.id : generateTierId(),
      hoursLate: Math.max(0, tierHoursLate),
      penaltyPercent: tier.penaltyPercent,
    }
  })

  return {
    tiers: normalizedTiers,
    rejectAfterHours: sourceConfig.rejectAfterHours,
  }
}

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
  const [isUploadingDescriptionImage, setIsUploadingDescriptionImage] =
    useState(false)
  const [showTemplateCode, setShowTemplateCode] = useState(false)

  const [formData, setFormData] = useState<AssignmentFormData>({
    assignmentName: "",
    description: "",
    descriptionImageUrl: null,
    descriptionImageAlt: "",
    programmingLanguage: "",
    deadline: "",
    allowResubmission: false,
    maxAttempts: null,
    templateCode: "",
    totalScore: null,
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
              descriptionImageUrl: assignment.descriptionImageUrl ?? null,
              descriptionImageAlt: assignment.descriptionImageAlt ?? "",
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
              latePenaltyEnabled: assignment.deadline
                ? (assignment.latePenaltyEnabled ?? false)
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
          updatedFormData.latePenaltyEnabled = false
        }
      }

      return updatedFormData
    })
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }))
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    const nameError = validateAssignmentTitle(formData.assignmentName)
    if (nameError) newErrors.assignmentName = nameError

    const descError = validateDescription(
      formData.description,
      formData.descriptionImageUrl,
    )
    if (descError) newErrors.description = descError

    const langError = validateProgrammingLanguage(formData.programmingLanguage)
    if (langError) newErrors.programmingLanguage = langError

    if (formData.deadline) {
      const deadlineError = validateDeadline(new Date(formData.deadline))
      if (deadlineError) newErrors.deadline = deadlineError
    }

    if (formData.scheduledDate) {
      const scheduledTime = formData.scheduledDate.split("T")[1]?.slice(0, 5)
      const hasScheduledTime = Boolean(scheduledTime)

      if (!hasScheduledTime) {
        newErrors.scheduledDate = "Release time is required"
      }
    }

    if (formData.totalScore === null) {
      newErrors.totalScore = "Total score is required"
    } else if (formData.totalScore < 1) {
      newErrors.totalScore = "Total score must be at least 1"
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

    if (formData.totalScore === null) {
      setErrors((prev) => ({
        ...prev,
        totalScore: "Total score is required",
      }))
      return
    }

    const hasDeadline = formData.deadline.trim().length > 0
    const shouldEnableLatePenalty = hasDeadline && formData.latePenaltyEnabled

    setIsLoading(true)

    try {
      if (isEditMode && assignmentId) {
        // Update existing assignment
        await updateAssignment(parseInt(assignmentId), {
          teacherId: parseInt(currentUser.id),
          assignmentName: formData.assignmentName.trim(),
          description: formData.description.trim(),
          descriptionImageUrl: formData.descriptionImageUrl,
          descriptionImageAlt: formData.descriptionImageAlt.trim() || null,
          programmingLanguage:
            formData.programmingLanguage as ProgrammingLanguage,
          deadline: formData.deadline ? new Date(formData.deadline) : null,
          allowResubmission: formData.allowResubmission,
          maxAttempts: formData.allowResubmission ? formData.maxAttempts : 1,
          templateCode: formData.templateCode || null,
          totalScore: formData.totalScore,
          scheduledDate: formData.scheduledDate
            ? new Date(formData.scheduledDate)
            : null,
          latePenaltyEnabled: shouldEnableLatePenalty,
          latePenaltyConfig: shouldEnableLatePenalty
            ? formData.latePenaltyConfig
            : null,
        })
        showToast("Assignment updated successfully")
      } else {
        // Create new assignment
        const newAssignment = await createAssignment({
          classId: parseInt(classId),
          teacherId: parseInt(currentUser.id),
          assignmentName: formData.assignmentName.trim(),
          description: formData.description.trim(),
          descriptionImageUrl: formData.descriptionImageUrl,
          descriptionImageAlt: formData.descriptionImageAlt.trim() || null,
          programmingLanguage:
            formData.programmingLanguage as ProgrammingLanguage,
          deadline: formData.deadline ? new Date(formData.deadline) : null,
          allowResubmission: formData.allowResubmission,
          maxAttempts: formData.allowResubmission ? formData.maxAttempts : 1,
          templateCode: formData.templateCode || null,
          totalScore: formData.totalScore,
          scheduledDate: formData.scheduledDate
            ? new Date(formData.scheduledDate)
            : null,
          latePenaltyEnabled: shouldEnableLatePenalty,
          latePenaltyConfig: shouldEnableLatePenalty
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

  const handleDescriptionImageUpload = async (file: File) => {
    if (!currentUser?.id || !classId) {
      setErrors({ general: "You must be logged in" })
      return
    }

    setIsUploadingDescriptionImage(true)
    try {
      const previousDescriptionImageUrl = formData.descriptionImageUrl

      const uploadedImageUrl = await uploadAssignmentDescriptionImage(
        parseInt(currentUser.id),
        parseInt(classId, 10),
        file,
      )

      setFormData((prev) => ({
        ...prev,
        descriptionImageUrl: uploadedImageUrl,
        descriptionImageAlt:
          prev.descriptionImageAlt.trim() ||
          prev.assignmentName.trim() ||
          "Assignment description image",
      }))
      setErrors((prev) => ({ ...prev, description: undefined, general: undefined }))

      if (
        previousDescriptionImageUrl &&
        previousDescriptionImageUrl !== uploadedImageUrl
      ) {
        await removeAssignmentDescriptionImage(previousDescriptionImageUrl)
      }
    } catch (error) {
      const uploadErrorMessage =
        error instanceof Error
          ? error.message
          : "Failed to upload description image"
      setErrors((prev) => ({
        ...prev,
        general: uploadErrorMessage,
      }))
      showToast(uploadErrorMessage, "error")
    } finally {
      setIsUploadingDescriptionImage(false)
    }
  }

  const handleRemoveDescriptionImage = async () => {
    const currentDescriptionImageUrl = formData.descriptionImageUrl

    setFormData((prev) => ({
      ...prev,
      descriptionImageUrl: null,
      descriptionImageAlt: "",
    }))

    if (!currentDescriptionImageUrl) {
      return
    }

    try {
      await removeAssignmentDescriptionImage(currentDescriptionImageUrl)
    } catch (error) {
      console.error("Failed to remove assignment description image:", error)
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
    isUploadingDescriptionImage,
    isEditMode,
    assignmentId,
    showTemplateCode,

    // Actions
    setShowTemplateCode,
    handleInputChange,
    handleDescriptionImageUpload,
    handleRemoveDescriptionImage,
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
