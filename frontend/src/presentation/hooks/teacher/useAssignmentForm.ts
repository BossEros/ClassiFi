import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { type ProgrammingLanguage } from "@/business/models/assignment/types"
import { getAssignmentById } from "@/business/services/assignmentService"
import { useAuthStore } from "@/shared/store/useAuthStore"
import {
  createAssignment,
  getClassById,
  removeAssignmentInstructionsImage,
  updateAssignment,
  uploadAssignmentInstructionsImage,
} from "@/business/services/classService"
import {
  createTestCase,
  deleteTestCase,
  getTestCases,
  updateTestCase,
} from "@/business/services/testCaseService"
import { DEFAULT_LATE_PENALTY_CONFIG } from "@/presentation/components/teacher/forms/assignment/LatePenaltyConfig"
import type { PendingTestCase } from "@/presentation/components/teacher/forms/testCases/TestCaseList"
import { useToastStore } from "@/shared/store/useToastStore"
import {
  buildAssignmentPayload,
  normalizeLatePenaltyConfig,
} from "@/presentation/hooks/teacher/assignmentForm.helpers"
import type {
  AssignmentFormData,
  FormErrors,
} from "@/presentation/hooks/teacher/assignmentForm.types"
import { useZodForm } from "@/presentation/hooks/shared/useZodForm"
import {
  assignmentFormSchema,
  type AssignmentFormValues,
} from "@/presentation/schemas/assignment/assignmentSchemas"
import { toLocalDateTimeString } from "@/presentation/utils/dateUtils"
import { getFieldErrorMessage } from "@/presentation/utils/formErrorMap"
import type { SelectOption } from "@/presentation/components/ui/Select"
import { PROGRAMMING_LANGUAGE_OPTIONS } from "@/shared/constants"
import type {
  CreateTestCaseRequest,
  TestCase,
  UpdateTestCaseRequest,
} from "@/shared/types/testCase"

export const programmingLanguageOptions: SelectOption[] =
  PROGRAMMING_LANGUAGE_OPTIONS.map((option) => ({ ...option }))

function buildDefaultFormValues(): AssignmentFormValues {
  return {
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
    latePenaltyConfig: normalizeLatePenaltyConfig(DEFAULT_LATE_PENALTY_CONFIG),
  }
}

export function useAssignmentForm() {
  const navigate = useNavigate()
  const { classId, assignmentId } = useParams<{
    classId: string
    assignmentId?: string
  }>()
  const showToast = useToastStore((state) => state.showToast)
  const currentUser = useAuthStore((state) => state.user)

  const isEditMode = !!assignmentId

  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(isEditMode)
  const [generalError, setGeneralError] = useState<string | undefined>()
  const [className, setClassName] = useState("")
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [pendingTestCases, setPendingTestCases] = useState<PendingTestCase[]>(
    [],
  )
  const [isLoadingTestCases, setIsLoadingTestCases] = useState(false)
  const [isUploadingInstructionsImage, setIsUploadingInstructionsImage] =
    useState(false)
  const [showTemplateCode, setShowTemplateCode] = useState(false)

  const formMethods = useZodForm({
    schema: assignmentFormSchema,
    defaultValues: buildDefaultFormValues(),
    mode: "onSubmit",
  })
  const {
    watch,
    setValue,
    clearErrors,
    reset,
    handleSubmit: handleValidatedSubmit,
    formState: { errors: formStateErrors },
  } = formMethods

  const formData = watch()
  const errors: FormErrors = {
    assignmentName: getFieldErrorMessage(formStateErrors, "assignmentName"),
    instructions: getFieldErrorMessage(formStateErrors, "instructions"),
    programmingLanguage: getFieldErrorMessage(
      formStateErrors,
      "programmingLanguage",
    ),
    deadline: getFieldErrorMessage(formStateErrors, "deadline"),
    scheduledDate: getFieldErrorMessage(formStateErrors, "scheduledDate"),
    totalScore: getFieldErrorMessage(formStateErrors, "totalScore"),
    maxAttempts: getFieldErrorMessage(formStateErrors, "maxAttempts"),
    general: generalError,
  }

  useEffect(() => {
    const fetchData = async () => {
      const user = currentUser

      if (!user || !classId) {
        return
      }

      setIsFetching(true)

      try {
        setGeneralError(undefined)

        const classData = await getClassById(
          parseInt(classId, 10),
          parseInt(user.id, 10),
        )
        setClassName(classData.className)

        if (isEditMode && assignmentId) {
          const assignment = await getAssignmentById(
            parseInt(assignmentId, 10),
            parseInt(user.id, 10),
          )

          if (assignment) {
            reset({
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
        setGeneralError("Failed to load data. Please try again.")
      } finally {
        setIsFetching(false)
      }
    }

    void fetchData()
  }, [assignmentId, classId, currentUser, isEditMode, reset])

  useEffect(() => {
    const fetchAssignmentTestCases = async () => {
      if (!isEditMode || !assignmentId) {
        return
      }

      setIsLoadingTestCases(true)

      try {
        const fetchedTestCases = await getTestCases(parseInt(assignmentId, 10))

        if (fetchedTestCases) {
          setTestCases(fetchedTestCases)
        }
      } catch (error) {
        console.error("Failed to load test cases:", error)
      } finally {
        setIsLoadingTestCases(false)
      }
    }

    void fetchAssignmentTestCases()
  }, [assignmentId, isEditMode])

  const handleInputChange = <K extends keyof AssignmentFormData>(
    field: K,
    value: AssignmentFormData[K],
  ) => {
    const normalizedField = field as keyof AssignmentFormValues

    setValue(
      normalizedField,
      value as AssignmentFormValues[typeof normalizedField],
      {
        shouldDirty: true,
        shouldTouch: true,
      },
    )

    if (field === "deadline") {
      const hasDeadline = typeof value === "string" && value.trim().length > 0

      if (!hasDeadline) {
        setValue("allowLateSubmissions", false, {
          shouldDirty: true,
          shouldTouch: true,
        })
      }
    }

    clearErrors(normalizedField)
    setGeneralError(undefined)
  }

  const submitAssignment = handleValidatedSubmit(async (validatedFormData) => {
    setGeneralError(undefined)

    if (!currentUser?.id || !classId) {
      setGeneralError("You must be logged in")
      return
    }

    setIsLoading(true)

    try {
      const assignmentPayload = buildAssignmentPayload(
        validatedFormData,
        parseInt(currentUser.id, 10),
      )

      if (isEditMode && assignmentId) {
        await updateAssignment(parseInt(assignmentId, 10), assignmentPayload)
        showToast("Assignment updated successfully")
      } else {
        const newAssignment = await createAssignment({
          classId: parseInt(classId, 10),
          ...assignmentPayload,
        })

        if (pendingTestCases.length > 0 && newAssignment?.id) {
          for (const pendingTestCase of pendingTestCases) {
            await createTestCase(newAssignment.id, {
              name: pendingTestCase.name,
              input: pendingTestCase.input,
              expectedOutput: pendingTestCase.expectedOutput,
              isHidden: pendingTestCase.isHidden,
              timeLimit: pendingTestCase.timeLimit,
              sortOrder: pendingTestCase.sortOrder,
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
      setGeneralError(
        `Failed to ${isEditMode ? "update" : "create"} assignment. Please try again.`,
      )
    } finally {
      setIsLoading(false)
    }
  })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    await submitAssignment()
  }

  const handleAddTestCase = async (data: CreateTestCaseRequest) => {
    if (!assignmentId) {
      return
    }

    try {
      const newTestCase = await createTestCase(parseInt(assignmentId, 10), data)

      if (newTestCase) {
        setTestCases((currentTestCases) => [...currentTestCases, newTestCase])
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
        setTestCases((currentTestCases) =>
          currentTestCases.map((testCase) =>
            testCase.id === id ? updatedTestCase : testCase,
          ),
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
      setTestCases((currentTestCases) =>
        currentTestCases.filter((testCase) => testCase.id !== id),
      )
      showToast("Test case deleted")
    } catch (error) {
      console.error("Failed to delete test case:", error)
      showToast("Failed to delete test case", "error")
    }
  }

  const handleAddPendingTestCase = (pendingTestCase: PendingTestCase) => {
    setPendingTestCases((currentPendingTestCases) => [
      ...currentPendingTestCases,
      pendingTestCase,
    ])
  }

  const handleUpdatePendingTestCase = (
    tempId: string,
    pendingTestCase: PendingTestCase,
  ) => {
    setPendingTestCases((currentPendingTestCases) =>
      currentPendingTestCases.map((currentPendingTestCase) =>
        currentPendingTestCase.tempId === tempId
          ? pendingTestCase
          : currentPendingTestCase,
      ),
    )
  }

  const handleDeletePendingTestCase = (tempId: string) => {
    setPendingTestCases((currentPendingTestCases) =>
      currentPendingTestCases.filter(
        (currentPendingTestCase) => currentPendingTestCase.tempId !== tempId,
      ),
    )
  }

  const handleInstructionsImageUpload = async (file: File) => {
    if (!currentUser?.id || !classId) {
      setGeneralError("You must be logged in")
      return
    }

    setIsUploadingInstructionsImage(true)

    try {
      const previousInstructionsImageUrl = formData.instructionsImageUrl
      const uploadedImageUrl = await uploadAssignmentInstructionsImage(
        parseInt(currentUser.id, 10),
        parseInt(classId, 10),
        file,
      )

      setValue("instructionsImageUrl", uploadedImageUrl, {
        shouldDirty: true,
        shouldTouch: true,
      })
      clearErrors("instructions")
      setGeneralError(undefined)

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

      setGeneralError(uploadErrorMessage)
      showToast(uploadErrorMessage, "error")
    } finally {
      setIsUploadingInstructionsImage(false)
    }
  }

  const handleRemoveInstructionsImage = async () => {
    const currentInstructionsImageUrl = formData.instructionsImageUrl

    setValue("instructionsImageUrl", null, {
      shouldDirty: true,
      shouldTouch: true,
    })

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
    formMethods,
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
    setShowTemplateCode,
    handleInputChange,
    handleInstructionsImageUpload,
    handleRemoveInstructionsImage,
    handleSubmit,
    handleAddTestCase,
    handleUpdateTestCase,
    handleDeleteTestCase,
    handleAddPendingTestCase,
    handleUpdatePendingTestCase,
    handleDeletePendingTestCase,
  }
}
