import { FileCode, FileUp, Calendar, Code, Image as ImageIcon, ChevronDown, Upload, Trash2, LoaderCircle } from "lucide-react";
import Editor from "@monaco-editor/react";
import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/Card";
import { DatePicker } from "@/presentation/components/ui/DatePicker";
import { Input } from "@/presentation/components/ui/Input";
import { Select } from "@/presentation/components/ui/Select";
import { Textarea } from "@/presentation/components/ui/Textarea";
import { TimePicker } from "@/presentation/components/ui/TimePicker";
import { programmingLanguageOptions } from "@/presentation/hooks/teacher/useAssignmentForm";
import { type AssignmentFormValues } from "@/presentation/schemas/assignment/assignmentSchemas";
import type { AssignmentFormData, PendingTestCase } from "@/presentation/hooks/teacher/assignmentForm.types";
import { formatTimeRemaining } from "@/presentation/utils/dateUtils";
import { getFieldErrorMessage } from "@/presentation/utils/formErrorMap";
import { getMonacoLanguage } from "@/presentation/utils/monacoUtils";
import type { CreateTestCaseRequest, TestCase, UpdateTestCaseRequest } from "@/data/api/test-case.types";
import { useState } from "react";
import { Plus, Edit2, EyeOff, FlaskConical } from "lucide-react";
import { Button } from "@/presentation/components/ui/Button";
import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/shared/utils/cn";
import { AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";
import { Eye, Terminal } from "lucide-react";
import { useZodForm } from "@/presentation/hooks/shared/useZodForm";
import { testCaseFormSchema, type TestCaseFormValues } from "@/presentation/schemas/assignment/assignmentSchemas";
import { assignmentFormTheme } from "@/presentation/constants/assignmentFormTheme";
import { DesktopOnlyFeatureNotice } from "@/presentation/components/shared/DesktopOnlyFeatureNotice";

// Inlined from src/presentation/components/teacher/forms/testCases/TestCaseList.tsx
// Inlined from src/presentation/components/teacher/forms/testCases/DeleteTestCaseModal.tsx
interface DeleteTestCaseModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  className?: string
  isDeleting?: boolean
  testCaseName?: string
}





function DeleteTestCaseModal({
  isOpen,
  onClose,
  onConfirm,
  className,
  isDeleting = false,
  testCaseName = "this test case",
}: DeleteTestCaseModalProps) {
  // Close on escape key
  React.useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose, isDeleting])

  if (!isOpen) return null

  const modalContent = (
    <div
      className="fixed inset-0 z-[10000] grid place-items-center p-4"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isDeleting ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-[448px] min-w-[320px] mx-auto p-6 flex-shrink-0",
          "rounded-xl border border-slate-200 bg-white",
          "shadow-xl shadow-slate-300/50",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-test-case-modal-title"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className={cn(
            "absolute top-4 right-4 p-1 rounded-lg",
            "cursor-pointer text-slate-400 hover:bg-slate-100 hover:text-slate-700",
            "transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning icon */}
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
            <AlertTriangle className="h-8 w-8 text-rose-600" />
          </div>
        </div>

        {/* Title */}
        <h2
          id="delete-test-case-modal-title"
          className="mb-2 text-center text-xl font-semibold text-slate-900"
        >
          Delete Test Case
        </h2>

        {/* Description */}
        <p className="mb-6 text-center text-slate-600">
          Are you sure you want to delete{" "}
          <span className="font-medium text-slate-900">"{testCaseName}"</span>? This
          action cannot be undone.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className={cn(
              "flex-1 px-4 py-3 rounded-xl text-sm font-semibold",
              "cursor-pointer border border-slate-300 text-slate-700",
              "hover:bg-slate-50 transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className={cn(
              "flex-1 px-4 py-3 rounded-xl text-sm font-semibold",
              "cursor-pointer bg-rose-600 text-white",
              "hover:bg-rose-700 transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  )

  // Render modal using portal to escape parent form context
  return createPortal(modalContent, document.body)
}



// Inlined from src/presentation/components/teacher/forms/testCases/TestCaseModal.tsx
type EditableTestCase = TestCase & { tempId?: string }





interface TestCaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreateTestCaseRequest | UpdateTestCaseRequest) => Promise<void>
  testCase?: EditableTestCase | null
  defaultName?: string
  isLoading?: boolean
}





function buildInitialFormValues(
  testCase: EditableTestCase | null | undefined,
  defaultName: string,
): TestCaseFormValues {
  if (testCase) {
    return {
      name: testCase.name || "",
      input: testCase.input || "",
      expectedOutput: testCase.expectedOutput || "",
      isHidden: testCase.isHidden ?? false,
      timeLimit: testCase.timeLimit ?? 5,
    }
  }

  return {
    name: defaultName,
    input: "",
    expectedOutput: "",
    isHidden: false,
    timeLimit: 5,
  }
}





export function TestCaseModal({
  isOpen,
  onClose,
  onSave,
  testCase,
  defaultName = "",
  isLoading = false,
}: TestCaseModalProps) {
  const isEditMode = !!testCase
  const {
    register,
    watch,
    setValue,
    reset,
    handleSubmit,
    formState: { errors },
  } = useZodForm({
    schema: testCaseFormSchema,
    defaultValues: buildInitialFormValues(testCase, defaultName),
    mode: "onSubmit",
  })

  const isHidden = watch("isHidden")
  const nameField = register("name")
  const inputField = register("input")
  const expectedOutputField = register("expectedOutput")

  useEffect(() => {
    if (!isOpen) {
      return
    }

    reset(buildInitialFormValues(testCase, defaultName))
  }, [defaultName, isOpen, reset, testCase])

  const submitTestCase = handleSubmit(async (formValues) => {
    if (isLoading) {
      return
    }

    await onSave({
      name: formValues.name.trim(),
      input: formValues.input,
      expectedOutput: formValues.expectedOutput,
      isHidden: formValues.isHidden,
      timeLimit: formValues.timeLimit,
    })
  })

  const handleModalSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    event.stopPropagation()
    await submitTestCase()
  }

  if (!isOpen) {
    return null
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-[10000] grid place-items-center p-4"
      onClick={(event) => event.stopPropagation()}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative mx-auto flex max-h-[90vh] min-w-[320px] w-full max-w-[560px] flex-shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Terminal className="h-5 w-5 text-teal-700" />
              {isEditMode ? "Edit Test Case" : "Add Test Case"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <form
            id="test-case-form"
            onSubmit={handleModalSubmit}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label
                htmlFor="tcName"
                className="text-sm font-medium text-slate-700"
              >
                Test Case Name <span className="text-xs font-normal text-slate-500">(optional)</span>
              </label>
              <Input
                id="tcName"
                placeholder="e.g., Basic Input Test (optional)"
                {...nameField}
                disabled={isLoading}
                maxLength={100}
                className={cn(
                  "border-slate-300 bg-slate-50 text-slate-800 placeholder:text-slate-400 shadow-sm hover:border-slate-400 hover:bg-white focus:border-teal-500/60 focus:bg-white focus:ring-teal-500/20",
                  errors.name && "border-rose-400",
                )}
              />
              {errors.name && (
                <p className="text-xs text-rose-600">{errors.name.message}</p>
              )}
              {!errors.name && (
                <p className="text-xs text-slate-500">
                  Leave empty to auto-name this case.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="tcInput"
                  className="text-sm font-medium text-slate-700"
                >
                  Input <span className="text-xs font-normal text-slate-500">(optional)</span>
                </label>
                <Textarea
                  id="tcInput"
                  placeholder="Enter input..."
                  {...inputField}
                  disabled={isLoading}
                  className="min-h-[88px] resize-none border-slate-300 bg-slate-50 font-mono text-sm text-slate-800 placeholder:text-slate-400 shadow-sm hover:border-slate-400 hover:bg-white focus:border-teal-500/60 focus:bg-white focus:ring-teal-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="tcOutput"
                    className="text-sm font-medium text-slate-700"
                  >
                    Expected Output
                  </label>
                </div>
                <Textarea
                  id="tcOutput"
                  placeholder="Enter expected output..."
                  {...expectedOutputField}
                  disabled={isLoading}
                  className={cn(
                    "min-h-[88px] resize-none border-slate-300 bg-slate-50 font-mono text-sm text-slate-800 placeholder:text-slate-400 shadow-sm hover:border-slate-400 hover:bg-white focus:border-teal-500/60 focus:bg-white focus:ring-teal-500/20",
                    errors.expectedOutput && "border-rose-400",
                  )}
                />
                {errors.expectedOutput && (
                  <p className="text-xs text-rose-600">
                    {errors.expectedOutput.message}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-1">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Configuration
              </label>
              <div
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group",
                  isHidden
                    ? "border-amber-300 bg-amber-50"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white",
                )}
                onClick={() => {
                  setValue("isHidden", !isHidden, {
                    shouldDirty: true,
                    shouldTouch: true,
                  })
                }}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {isHidden ? (
                      <EyeOff className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-teal-400" />
                    )}
                    <span
                      className={cn(
                        "text-sm font-medium transition-colors",
                        isHidden ? "text-amber-800" : "text-slate-700",
                      )}
                    >
                      {isHidden ? "Hidden Test Case" : "Visible Test Case"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 transition-colors group-hover:text-slate-600">
                    {isHidden
                      ? "Input and output are hidden from students."
                      : "Students can see the input and expected output."}
                  </p>
                </div>

                <div
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors duration-200",
                    isHidden ? "bg-amber-500" : "bg-slate-300",
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200",
                      isHidden ? "left-6" : "left-1",
                    )}
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="z-10 border-t border-slate-200 bg-slate-50 px-5 py-4">
          <div className="flex items-center justify-center gap-2.5">
            <Button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              variant="secondary"
              size="sm"
              className="min-w-[110px] border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="test-case-form"
              isLoading={isLoading}
              size="sm"
              className="min-w-[140px]"
            >
              {isEditMode ? "Save Changes" : "Add Test Case"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}


interface TestCaseListProps {
  testCases: TestCase[]
  pendingTestCases?: PendingTestCase[]
  isLoading?: boolean
  isEditMode: boolean
  assignmentId?: number
  onAdd: (data: CreateTestCaseRequest) => Promise<void>
  onAddPending?: (data: PendingTestCase) => void
  onUpdate: (id: number, data: UpdateTestCaseRequest) => Promise<void>
  onUpdatePending?: (tempId: string, data: PendingTestCase) => void
  onDelete: (id: number) => Promise<void>
  onDeletePending?: (tempId: string) => void
}



function TestCaseList({
  testCases,
  pendingTestCases = [],
  isLoading = false,
  isEditMode,
  onAdd,
  onAddPending,
  onUpdate,
  onUpdatePending,
  onDelete,
  onDeletePending,
}: TestCaseListProps) {
  // Create a unified type for display
  interface DisplayTestCase {
    id: number
    tempId?: string
    assignmentId: number
    name: string
    input: string
    expectedOutput: string
    isHidden: boolean
    timeLimit: number
    sortOrder: number
    createdAt: string
  }

  const allTestCases: DisplayTestCase[] = [
    ...testCases,
    ...pendingTestCases.map((p) => ({
      id: -1, // Marker for pending
      tempId: p.tempId,
      assignmentId: 0,
      name: p.name,
      input: p.input,
      expectedOutput: p.expectedOutput,
      isHidden: p.isHidden,
      timeLimit: p.timeLimit,
      sortOrder: p.sortOrder,
      createdAt: "",
    })),
  ]

  const resolveAutoCaseName = (index: number): string => `Case ${index + 1}`

  const [showSection, setShowSection] = useState(allTestCases.length > 0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTestCase, setEditingTestCase] = useState<
    (TestCase & { tempId?: string }) | null
  >(null)
  const [savingId, setSavingId] = useState<number | string | null>(null)
  const [deletingId, setDeletingId] = useState<number | string | null>(null)

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [testCaseToDelete, setTestCaseToDelete] = useState<
    (TestCase & { tempId?: string }) | null
  >(null)

  const handleOpenAdd = () => {
    setEditingTestCase(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (tc: TestCase & { tempId?: string }) => {
    setEditingTestCase(tc)
    setModalOpen(true)
  }

  const handleSave = async (
    data: CreateTestCaseRequest | UpdateTestCaseRequest,
  ) => {
    const normalizedName = data.name?.trim() ?? ""

    const fallbackNameForEdit = (() => {
      if (!editingTestCase) {
        return resolveAutoCaseName(allTestCases.length)
      }

      const editIndex = allTestCases.findIndex((tc) =>
        editingTestCase.tempId
          ? tc.tempId === editingTestCase.tempId
          : tc.id === editingTestCase.id,
      )

      if (editIndex >= 0) {
        return resolveAutoCaseName(editIndex)
      }

      return resolveAutoCaseName(allTestCases.length)
    })()

    const resolvedName =
      normalizedName ||
      (editingTestCase?.name?.trim() ?? "") ||
      fallbackNameForEdit

    const normalizedData = {
      ...data,
      name: resolvedName,
    }

    try {
      if (editingTestCase) {
        // Editing existing
        if (editingTestCase.tempId) {
          // Pending test case
          onUpdatePending?.(editingTestCase.tempId, {
            tempId: editingTestCase.tempId,
            name: normalizedData.name,
            input: normalizedData.input || "",
            expectedOutput: normalizedData.expectedOutput || "",
            isHidden: normalizedData.isHidden ?? false,
            timeLimit: normalizedData.timeLimit ?? 5,
            sortOrder: editingTestCase.sortOrder,
          })
        } else {
          // Persisted test case
          setSavingId(editingTestCase.id)
          await onUpdate(
            editingTestCase.id,
            normalizedData as UpdateTestCaseRequest,
          )
        }
      } else {
        // Adding new
        if (isEditMode) {
          await onAdd(normalizedData as CreateTestCaseRequest)
        } else {
          // Create pending test case
          onAddPending?.({
            tempId: `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            name: normalizedData.name,
            input: normalizedData.input || "",
            expectedOutput: normalizedData.expectedOutput || "",
            isHidden: normalizedData.isHidden ?? false,
            timeLimit: normalizedData.timeLimit ?? 5,
            sortOrder: pendingTestCases.length,
          })
        }
      }
      setModalOpen(false)
    } finally {
      setSavingId(null)
    }
  }

  const handleDeleteClick = (tc: TestCase & { tempId?: string }) => {
    setTestCaseToDelete(tc)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!testCaseToDelete) return

    try {
      if (testCaseToDelete.tempId) {
        setDeletingId(testCaseToDelete.tempId)
        onDeletePending?.(testCaseToDelete.tempId)
      } else {
        setDeletingId(testCaseToDelete.id)
        await onDelete(testCaseToDelete.id)
      }
      setDeleteModalOpen(false)
      setTestCaseToDelete(null)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-3 border-t border-slate-200 pt-4">
      <button
        type="button"
        onClick={() => setShowSection(!showSection)}
        className="flex items-center gap-2 text-sm font-semibold text-slate-800 transition-colors hover:text-teal-700"
      >
        <FlaskConical className="h-4 w-4 text-teal-700" />
        Test Cases {allTestCases.length > 0 && `(${allTestCases.length})`}
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            showSection ? "rotate-180" : ""
          }`}
        />
      </button>

      {showSection && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-xs text-slate-500">
            Define test cases to automatically verify student submissions.
            {!isEditMode &&
              pendingTestCases.length > 0 &&
              " (will be saved when assignment is created)"}
          </p>

          {/* Test Case List */}
          {allTestCases.length > 0 ? (
            <div className="space-y-2">
              {allTestCases.map((tc, index) => {
                const isPending = !!tc.tempId
                const uniqueKey = tc.tempId ?? `tc-${tc.id}`

                return (
                  <div
                    key={uniqueKey}
                    className={`group flex items-center gap-3 rounded-xl border p-3 transition-all duration-200 ${
                      isPending
                        ? "border-teal-200 bg-teal-50/70 hover:bg-teal-50"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-xs text-slate-600">
                      {index + 1}
                    </span>

                    <span className="flex-1 truncate text-sm font-medium text-slate-800">
                      {tc.name?.trim() || resolveAutoCaseName(index)}
                    </span>

                    <div className="flex items-center gap-2">
                      {tc.isHidden && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          <EyeOff className="w-3 h-3" />
                          Hidden
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenEdit(tc as TestCase & { tempId?: string })
                        }
                        disabled={isLoading || savingId === uniqueKey}
                        className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteClick(
                            tc as TestCase & { tempId?: string },
                          )
                        }
                        disabled={isLoading || deletingId === uniqueKey}
                        className="cursor-pointer rounded-lg p-1.5 text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
                        title="Delete"
                      >
                        {deletingId === uniqueKey ? (
                          <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="group rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition-all hover:border-slate-400 hover:bg-white">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 transition-transform group-hover:scale-110">
                <FlaskConical className="h-6 w-6 text-teal-700 transition-colors" />
              </div>
              <p className="text-sm font-medium text-slate-700">
                No test cases defined
              </p>
              <p className="mx-auto mt-1 max-w-[250px] text-xs text-slate-500">
                Add test cases to verify student submissions automatically.
              </p>
            </div>
          )}

          <Button
            type="button"
            onClick={handleOpenAdd}
            disabled={isLoading}
            className="h-11 w-full rounded-xl border border-dashed border-slate-300 bg-white text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Test Case
          </Button>
        </div>
      )}

      <TestCaseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        testCase={editingTestCase}
        defaultName={resolveAutoCaseName(allTestCases.length)}
        isLoading={savingId !== null}
      />

      <DeleteTestCaseModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setTestCaseToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={deletingId !== null}
        testCaseName={testCaseToDelete?.name}
      />
    </div>
  )
}

interface BasicInfoFormProps {
  isLoading: boolean
  isUploadingInstructionsImage: boolean
  isTotalScoreLocked: boolean
  showTemplateCode: boolean
  setShowTemplateCode: (show: boolean) => void
  onInstructionsImageUpload: (file: File) => Promise<void>
  onInstructionsImageRemove: () => Promise<void>
  testCases: TestCase[]
  pendingTestCases: PendingTestCase[]
  isLoadingTestCases: boolean
  isEditMode: boolean
  assignmentId?: string
  onAddTestCase: (data: CreateTestCaseRequest) => Promise<void>
  onAddPendingTestCase: (data: PendingTestCase) => void
  onUpdateTestCase: (id: number, data: UpdateTestCaseRequest) => Promise<void>
  onUpdatePendingTestCase: (tempId: string, data: PendingTestCase) => void
  onDeleteTestCase: (id: number) => Promise<void>
  onDeletePendingTestCase: (tempId: string) => void
  handleInputChange: <K extends keyof AssignmentFormData>(
    field: K,
    value: AssignmentFormData[K],
  ) => void
}

function mapTemplateFileNameToProgrammingLanguage(
  fileName: string,
): AssignmentFormValues["programmingLanguage"] {
  const lowerCaseFileName = fileName.toLowerCase()

  if (lowerCaseFileName.endsWith(".py")) {
    return "python"
  }

  if (lowerCaseFileName.endsWith(".java")) {
    return "java"
  }

  if (lowerCaseFileName.endsWith(".c")) {
    return "c"
  }

  return ""
}

function mapMonacoLanguageToTemplatePath(monacoLanguage: string): string {
  if (monacoLanguage === "python") {
    return "template-code.py"
  }

  if (monacoLanguage === "java") {
    return "template-code.java"
  }

  if (monacoLanguage === "c") {
    return "template-code.c"
  }

  return "template-code.txt"
}

export function BasicInfoForm({
  isLoading,
  isUploadingInstructionsImage,
  isTotalScoreLocked,
  showTemplateCode,
  setShowTemplateCode,
  onInstructionsImageUpload,
  onInstructionsImageRemove,
  testCases,
  pendingTestCases,
  isLoadingTestCases,
  isEditMode,
  assignmentId,
  onAddTestCase,
  onAddPendingTestCase,
  onUpdateTestCase,
  onUpdatePendingTestCase,
  onDeleteTestCase,
  onDeletePendingTestCase,
  handleInputChange,
}: BasicInfoFormProps) {
  const {
    watch,
    formState: { errors: formErrors },
  } = useFormContext<AssignmentFormValues>()
  const formData = watch()

  const errors = {
    assignmentName: getFieldErrorMessage(formErrors, "assignmentName"),
    instructions: getFieldErrorMessage(formErrors, "instructions"),
    programmingLanguage: getFieldErrorMessage(
      formErrors,
      "programmingLanguage",
    ),
    deadline: getFieldErrorMessage(formErrors, "deadline"),
    scheduledDate: getFieldErrorMessage(formErrors, "scheduledDate"),
    totalScore: getFieldErrorMessage(formErrors, "totalScore"),
  }

  const deadlineDate = formData.deadline ? new Date(formData.deadline) : null
  const isValidDeadline = deadlineDate && !Number.isNaN(deadlineDate.getTime())

  const parsedId = assignmentId ? parseInt(assignmentId, 10) : Number.NaN
  const validAssignmentId = !Number.isNaN(parsedId) ? parsedId : undefined
  const isInstructionsImageBusy = isLoading || isUploadingInstructionsImage
  const templateCodeMonacoLanguage = getMonacoLanguage(
    formData.programmingLanguage || "",
  )
  const templateCodeEditorPath = mapMonacoLanguageToTemplatePath(
    templateCodeMonacoLanguage,
  )

  return (
    <Card className={assignmentFormTheme.sectionCard}>
      <CardHeader className={assignmentFormTheme.sectionHeader}>
        <div className="flex items-center gap-3">
          <FileCode className="h-5 w-5 text-teal-700" />
          <CardTitle className="text-slate-900">Basic Information</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="assignmentName"
              className="block text-sm font-medium text-slate-700"
            >
              Assignment Title
            </label>
            <Input
              id="assignmentName"
              type="text"
              placeholder="e.g., Fibonacci Sequence Implementation"
              value={formData.assignmentName}
              onChange={(event) =>
                handleInputChange("assignmentName", event.target.value)
              }
              disabled={isLoading}
              className={`h-11 rounded-xl border bg-slate-50 text-slate-800 placeholder:text-slate-400 shadow-sm transition-all duration-200 hover:border-slate-400 hover:bg-white focus:border-teal-500/60 focus:bg-white focus:ring-teal-500/20 ${
                errors.assignmentName ? "border-rose-400" : "border-slate-300"
              }`}
              maxLength={150}
            />
            {errors.assignmentName && (
              <p className="text-xs text-rose-600">{errors.assignmentName}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="instructions"
              className="block text-sm font-medium text-slate-700"
            >
              Instructions <span className="text-xs font-normal text-slate-500">(optional)</span>
            </label>

            <div
              className={`overflow-hidden rounded-xl border bg-slate-50 transition-all duration-200 hover:border-slate-400 hover:bg-white focus-within:border-teal-500/60 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-500/20 ${
                errors.instructions ? "border-rose-400" : "border-slate-300"
              }`}
            >
              <Textarea
                id="instructions"
                placeholder="Write clear instructions for your students..."
                value={formData.instructions}
                onChange={(event) =>
                  handleInputChange("instructions", event.target.value)
                }
                disabled={isLoading}
                className="min-h-[140px] w-full resize-y rounded-t-xl rounded-b-none border-0 bg-transparent px-4 py-3 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 shadow-none ring-0 transition-none hover:bg-transparent focus:border-0 focus:bg-transparent focus:ring-0 focus:outline-none"
                rows={6}
              />

              {formData.instructionsImageUrl && (
                <div className="mx-3 mb-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    <ImageIcon className="h-3 w-3" />
                    Attachment
                  </div>

                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <img
                      src={formData.instructionsImageUrl}
                      alt="Assignment instructions"
                      className="w-full max-h-64 object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <label
                    htmlFor="instructions-image-upload"
                    className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-all duration-200 ${
                      isInstructionsImageBusy
                        ? "cursor-not-allowed text-slate-400"
                        : "cursor-pointer text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                    }`}
                  >
                    {isUploadingInstructionsImage ? (
                      <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    {isUploadingInstructionsImage
                      ? "Uploading..."
                      : formData.instructionsImageUrl
                        ? "Replace image"
                        : "Attach image"}
                  </label>

                  <input
                    id="instructions-image-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    disabled={isInstructionsImageBusy}
                    className="hidden"
                    onChange={(event) => {
                      const selectedImageFile = event.target.files?.[0]

                      if (selectedImageFile) {
                        void onInstructionsImageUpload(selectedImageFile)
                      }

                      event.currentTarget.value = ""
                    }}
                  />

                  {formData.instructionsImageUrl && (
                    <>
                      <div className="h-3.5 w-px bg-slate-200" />

                      <button
                        type="button"
                        onClick={() => void onInstructionsImageRemove()}
                        disabled={isInstructionsImageBusy}
                        className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40 transition-all duration-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {errors.instructions && (
              <p className="text-xs text-rose-600">{errors.instructions}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="programmingLanguage"
                className="block text-sm font-medium text-slate-700"
              >
                Programming Language
              </label>
              <Select
                id="programmingLanguage"
                options={programmingLanguageOptions}
                value={formData.programmingLanguage}
                onChange={(value) =>
                  handleInputChange(
                    "programmingLanguage",
                    value as AssignmentFormData["programmingLanguage"],
                  )
                }
                disabled={isLoading}
                className={`h-11 rounded-xl border py-0 shadow-sm transition-all duration-200 hover:border-slate-400 hover:bg-white focus:border-teal-500/60 focus:bg-white focus:ring-teal-500/20 [&>option]:bg-white [&>option]:text-slate-700 ${
                  formData.programmingLanguage ? "border-slate-300 bg-slate-50 text-slate-800" : "border-slate-300 bg-slate-50 text-slate-400"
                } ${
                  errors.programmingLanguage
                    ? "border-rose-400 focus:border-rose-400 focus:ring-rose-500/20"
                    : ""
                }`}
                placeholder="Select language"
              />
              {errors.programmingLanguage && (
                <p className="text-xs text-rose-600">
                  {errors.programmingLanguage}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="totalScore"
                className="block text-sm font-medium text-slate-700"
              >
                Total Score
              </label>
              <div className="relative group">
                <Input
                  id="totalScore"
                  type="number"
                  value={formData.totalScore ?? ""}
                  onChange={(event) => {
                    const value = event.target.value

                    if (value === "") {
                      handleInputChange("totalScore", null)
                      return
                    }

                    const parsed = parseInt(value, 10)

                    if (!Number.isNaN(parsed)) {
                      handleInputChange("totalScore", parsed)
                    }
                  }}
                  placeholder="Enter total score"
                  min="1"
                  disabled={isLoading || isTotalScoreLocked}
                  className={`h-11 w-full rounded-xl border bg-slate-50 pr-16 text-slate-800 placeholder:text-slate-400 shadow-sm transition-all duration-200 hover:border-slate-400 hover:bg-white focus:border-teal-500/60 focus:bg-white focus:ring-teal-500/20 ${
                    errors.totalScore ? "border-rose-400" : "border-slate-300"
                  }`}
                />
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 transition-colors group-focus-within:text-teal-700">
                  Points
                </div>
              </div>
              {isTotalScoreLocked && (
                <p className="text-xs text-amber-700">
                  Total score is locked because this assignment already has graded submissions.
                </p>
              )}
              {errors.totalScore && (
                <p className="text-xs text-rose-600">{errors.totalScore}</p>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePicker
                label="Deadline Date"
                labelClassName="text-slate-700"
                value={formData.deadline}
                variant="light"
                onChange={(dateIso) => {
                  const time =
                    formData.deadline.split("T")[1]?.slice(0, 5) || ""
                  const date = dateIso ? dateIso.split("T")[0] : ""

                  if (date) {
                    handleInputChange(
                      "deadline",
                      time ? `${date}T${time}` : date,
                    )
                  } else {
                    handleInputChange("deadline", "")
                  }
                }}
                error={errors.deadline}
                minDate={new Date()}
                disabled={isLoading}
              />
              <TimePicker
                label="Deadline Time"
                labelClassName="text-slate-700"
                value={formData.deadline.split("T")[1]?.slice(0, 5) || ""}
                variant="light"
                onChange={(timeValue) => {
                  const date = formData.deadline.split("T")[0]

                  if (!date) {
                    return
                  }

                  if (timeValue) {
                    handleInputChange("deadline", `${date}T${timeValue}`)
                  } else {
                    handleInputChange("deadline", date)
                  }
                }}
                disabled={isLoading}
              />
            </div>
          </div>

          {isValidDeadline && deadlineDate && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-amber-700">
                    Selected Deadline
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {deadlineDate.toLocaleString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-amber-700">
                    Time remaining
                  </p>
                  <p className="font-mono text-sm font-medium text-slate-900">
                    {formatTimeRemaining(deadlineDate)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 border-t border-slate-200 pt-6">
            <div
              className={`flex items-center justify-between rounded-xl border p-4 transition-all duration-300 ${
                formData.scheduledDate
                  ? "border-violet-200 bg-violet-50"
                  : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <div className="flex items-center gap-4">
                <Calendar
                  className={`h-5 w-5 ${
                    formData.scheduledDate
                      ? "text-violet-700"
                      : "text-teal-700"
                  }`}
                />
                <div className="space-y-1">
                  <h3
                    className={`text-sm font-semibold transition-colors ${
                      formData.scheduledDate ? "text-slate-900" : "text-slate-800"
                    }`}
                  >
                    Scheduled Release
                  </h3>
                  <p className="hidden text-xs text-slate-500 sm:block">
                    Automatically publish this assignment at a future date and
                    time
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={!!formData.scheduledDate}
                onClick={() => {
                  if (formData.scheduledDate) {
                    handleInputChange("scheduledDate", null)
                  } else {
                    const now = new Date()
                    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
                    const todayDateOnly = now.toISOString().split("T")[0]
                    handleInputChange("scheduledDate", todayDateOnly)
                  }
                }}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:ring-offset-2 focus:ring-offset-white ${
                  formData.scheduledDate ? "bg-violet-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ${
                    formData.scheduledDate ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {formData.scheduledDate && (
              <div className="animate-in slide-in-from-top-2 fade-in duration-300 pl-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DatePicker
                    label="Release Date"
                    labelClassName="text-slate-700"
                    variant="light"
                    value={formData.scheduledDate}
                    onChange={(dateIso) => {
                      const time =
                        formData.scheduledDate?.split("T")[1]?.slice(0, 5) || ""
                      const date = dateIso ? dateIso.split("T")[0] : ""

                      if (date) {
                        handleInputChange(
                          "scheduledDate",
                          time ? `${date}T${time}` : date,
                        )
                      } else {
                        handleInputChange("scheduledDate", null)
                      }
                    }}
                    minDate={new Date()}
                    disabled={isLoading}
                  />
                  <TimePicker
                    label="Release Time"
                    labelClassName="text-slate-700"
                    variant="light"
                    value={
                      formData.scheduledDate.split("T")[1]?.slice(0, 5) || ""
                    }
                    onChange={(timeValue) => {
                      const date = formData.scheduledDate?.split("T")[0]

                      if (!date) {
                        return
                      }

                      if (timeValue) {
                        handleInputChange(
                          "scheduledDate",
                          `${date}T${timeValue}`,
                        )
                      } else {
                        handleInputChange("scheduledDate", date)
                      }
                    }}
                    error={errors.scheduledDate}
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
          </div>

          {errors.deadline && (
            <p className="text-xs text-rose-600">{errors.deadline}</p>
          )}
        </div>

        <div className="space-y-2 border-t border-slate-200 pt-4">
          {/* Mobile notice */}
          <div className="lg:hidden">
            <DesktopOnlyFeatureNotice
              title="Template Code"
              description="The code editor for template code is available on desktop."
            />
          </div>

          {/* Desktop toggle + editor */}
          <div className="hidden lg:block space-y-2">
          <button
            type="button"
            onClick={() => setShowTemplateCode(!showTemplateCode)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-800 transition-colors hover:text-teal-700"
          >
            <Code className="h-4 w-4 text-teal-700" />
            Template Code
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                showTemplateCode ? "rotate-180" : ""
              }`}
            />
          </button>

          {showTemplateCode && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-xs text-slate-500">
                Provide starter/template code that will be excluded from
                similarity analysis. Students won't be flagged for using this
                code.
              </p>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <Editor
                  key={templateCodeMonacoLanguage}
                  height="300px"
                  theme="vs-light"
                  language={templateCodeMonacoLanguage}
                  path={templateCodeEditorPath}
                  value={formData.templateCode}
                  onChange={(value) =>
                    handleInputChange("templateCode", value || "")
                  }
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 },
                    fontFamily:
                      "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                    formatOnPaste: true,
                    formatOnType: true,
                  }}
                />

                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <label
                      htmlFor="template-code-upload"
                      className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2 text-xs font-medium text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-800"
                    >
                      <FileUp className="w-3.5 h-3.5" />
                      Upload file
                    </label>

                    <input
                      id="template-code-upload"
                      type="file"
                      accept=".py,.java,.cpp,.c,.cs,.js,.ts,.jsx,.tsx,.rb,.go,.rs,.php,.swift,.kt,.scala,.r,.m,.h,.hpp,.txt"
                      className="hidden"
                      onChange={(event) => {
                        const selectedFile = event.target.files?.[0]

                        if (selectedFile) {
                          const detectedTemplateProgrammingLanguage =
                            mapTemplateFileNameToProgrammingLanguage(
                              selectedFile.name,
                            )

                          if (
                            detectedTemplateProgrammingLanguage &&
                            detectedTemplateProgrammingLanguage !==
                              formData.programmingLanguage
                          ) {
                            handleInputChange(
                              "programmingLanguage",
                              detectedTemplateProgrammingLanguage as AssignmentFormData["programmingLanguage"],
                            )
                          }

                          const reader = new FileReader()

                          reader.onload = (loadEvent) => {
                            const content = loadEvent.target?.result

                            if (typeof content === "string") {
                              handleInputChange("templateCode", content)
                            }
                          }

                          reader.readAsText(selectedFile)
                        }

                        event.currentTarget.value = ""
                      }}
                    />

                    {formData.templateCode && (
                      <>
                        <div className="h-3.5 w-px bg-slate-200" />

                        <button
                          type="button"
                          onClick={() => handleInputChange("templateCode", "")}
                          className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-rose-600 transition-all duration-200 hover:bg-rose-50 hover:text-rose-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Clear
                        </button>
                      </>
                    )}
                  </div>

                  {formData.templateCode && (
                    <span className="text-[11px] tabular-nums text-slate-500">
                      {formData.templateCode.split("\n").length} lines -{" "}
                      {formData.templateCode.length} chars
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          </div>
        </div>

        <TestCaseList
          testCases={testCases}
          pendingTestCases={pendingTestCases}
          isLoading={isLoadingTestCases}
          isEditMode={isEditMode}
          assignmentId={validAssignmentId}
          onAdd={onAddTestCase}
          onAddPending={onAddPendingTestCase}
          onUpdate={onUpdateTestCase}
          onUpdatePending={onUpdatePendingTestCase}
          onDelete={onDeleteTestCase}
          onDeletePending={onDeletePendingTestCase}
        />
      </CardContent>
    </Card>
  )
}

