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
import type { CreateTestCaseRequest, TestCase, UpdateTestCaseRequest } from "@/shared/types/testCase";
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
          "rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-sm",
          "shadow-xl shadow-black/20",
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
            "text-gray-400 hover:text-white hover:bg-white/10",
            "transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        {/* Title */}
        <h2
          id="delete-test-case-modal-title"
          className="text-xl font-semibold text-white text-center mb-2"
        >
          Delete Test Case
        </h2>

        {/* Description */}
        <p className="text-gray-400 text-center mb-6">
          Are you sure you want to delete{" "}
          <span className="text-white font-medium">"{testCaseName}"</span>? This
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
              "border border-white/20 text-white",
              "hover:bg-white/10 transition-colors duration-200",
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
              "bg-red-500 text-white",
              "hover:bg-red-600 transition-colors duration-200",
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

      <div className="relative w-full max-w-[560px] min-w-[320px] mx-auto bg-[#161926] border border-white/15 rounded-xl shadow-[0_8px_60px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.06)] animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh] flex-shrink-0">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/[0.04]">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-teal-400" />
              {isEditMode ? "Edit Test Case" : "Add Test Case"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
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
                className="text-sm font-medium text-gray-300"
              >
                Test Case Name
              </label>
              <Input
                id="tcName"
                placeholder="e.g., Basic Input Test (optional)"
                {...nameField}
                disabled={isLoading}
                maxLength={100}
                className={cn(
                  "bg-[#1A2130] border-white/10 text-white placeholder:text-gray-500 hover:bg-[#1A2130] hover:border-white/20 focus:bg-[#1A2130] focus:ring-blue-500/20 focus:border-blue-500/50",
                  errors.name && "border-red-500/50",
                )}
              />
              {errors.name && (
                <p className="text-xs text-red-400">{errors.name.message}</p>
              )}
              {!errors.name && (
                <p className="text-xs text-gray-500">
                  Leave empty to auto-name this case.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="tcInput"
                  className="text-sm font-medium text-gray-300"
                >
                  Input
                </label>
                <Textarea
                  id="tcInput"
                  placeholder="Enter input..."
                  {...inputField}
                  disabled={isLoading}
                  className="min-h-[88px] resize-none font-mono text-sm bg-[#1A2130] border-white/10 text-white placeholder:text-gray-500 hover:bg-[#1A2130] hover:border-white/20 focus:bg-[#1A2130] focus:ring-blue-500/20 focus:border-blue-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="tcOutput"
                    className="text-sm font-medium text-gray-300"
                  >
                    Expected Output <span className="text-red-400">*</span>
                  </label>
                </div>
                <Textarea
                  id="tcOutput"
                  placeholder="Enter expected output..."
                  {...expectedOutputField}
                  disabled={isLoading}
                  className={cn(
                    "min-h-[88px] resize-none font-mono text-sm bg-[#1A2130] border-white/10 text-white placeholder:text-gray-500 hover:bg-[#1A2130] hover:border-white/20 focus:bg-[#1A2130] focus:ring-blue-500/20 focus:border-blue-500/50",
                    errors.expectedOutput && "border-red-500/50",
                  )}
                />
                {errors.expectedOutput && (
                  <p className="text-xs text-red-400">
                    {errors.expectedOutput.message}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-1">
              <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                Configuration
              </label>
              <div
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group",
                  isHidden
                    ? "bg-amber-500/[0.08] border-amber-500/30"
                    : "bg-white/[0.03] border-white/10 hover:bg-white/[0.05]",
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
                        isHidden ? "text-amber-200" : "text-gray-200",
                      )}
                    >
                      {isHidden ? "Hidden Test Case" : "Visible Test Case"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                    {isHidden
                      ? "Input and output are hidden from students."
                      : "Students can see the input and expected output."}
                  </p>
                </div>

                <div
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors duration-200",
                    isHidden ? "bg-amber-500" : "bg-gray-600",
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

        <div className="border-t border-white/10 bg-white/[0.04] px-5 py-4 z-10">
          <div className="flex items-center justify-center gap-2.5">
            <Button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              variant="secondary"
              size="sm"
              className="min-w-[110px]"
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
    <div className="space-y-3 pt-4 border-t border-white/10">
      {/* Section Toggle */}
      <button
        type="button"
        onClick={() => setShowSection(!showSection)}
        className="flex items-center gap-2 text-sm font-medium text-gray-200 hover:text-white transition-colors"
      >
        <FlaskConical className="w-4 h-4" />
        Test Cases {allTestCases.length > 0 && `(${allTestCases.length})`}
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            showSection ? "rotate-180" : ""
          }`}
        />
      </button>

      {showSection && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-xs text-gray-300">
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
                    className={`flex items-center gap-3 p-3 rounded-xl border group transition-all duration-200 ${
                      isPending
                        ? "bg-teal-500/5 border-teal-500/20 hover:bg-teal-500/10"
                        : "bg-black/20 border-white/5 hover:border-white/10 hover:bg-black/30"
                    }`}
                  >
                    {/* Index */}
                    <span className="w-6 h-6 flex items-center justify-center rounded bg-white/10 text-xs text-gray-400">
                      {index + 1}
                    </span>

                    {/* Name */}
                    <span className="flex-1 text-sm text-white truncate">
                      {tc.name?.trim() || resolveAutoCaseName(index)}
                    </span>

                    {/* Badges */}
                    <div className="flex items-center gap-2">
                      {tc.isHidden && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs">
                          <EyeOff className="w-3 h-3" />
                          Hidden
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenEdit(tc as TestCase & { tempId?: string })
                        }
                        disabled={isLoading || savingId === uniqueKey}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
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
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
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
            <div className="p-8 rounded-xl bg-black/20 border-2 border-dashed border-white/10 text-center hover:bg-black/30 hover:border-white/20 transition-all group">
              <div className="w-12 h-12 rounded-full bg-white/5 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FlaskConical className="w-6 h-6 text-gray-400 group-hover:text-blue-400 transition-colors" />
              </div>
              <p className="text-sm font-medium text-gray-300">
                No test cases defined
              </p>
              <p className="text-xs text-gray-500 mt-1 max-w-[250px] mx-auto">
                Add test cases to verify student submissions automatically.
              </p>
            </div>
          )}

          {/* Add Button - Always show */}
          <Button
            type="button"
            onClick={handleOpenAdd}
            disabled={isLoading}
            className="w-full h-11 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-dashed border-white/20 hover:border-white/30 rounded-xl transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Test Case
          </Button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <TestCaseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        testCase={editingTestCase}
        defaultName={resolveAutoCaseName(allTestCases.length)}
        isLoading={savingId !== null}
      />

      {/* Delete Confirmation Modal */}
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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <FileCode className="w-5 h-5 text-blue-300" />
          </div>
          <CardTitle>Basic Information</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="assignmentName"
              className="block text-sm font-medium text-gray-200"
            >
              Assignment Title <span className="text-red-400">*</span>
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
              className={`h-11 bg-[#1A2130] border-white/10 text-white placeholder:text-gray-500 rounded-xl transition-all duration-200 hover:bg-[#1A2130] hover:border-white/20 focus:bg-[#1A2130] focus:ring-blue-500/20 focus:border-blue-500/50 ${
                errors.assignmentName ? "border-red-500/50" : ""
              }`}
              maxLength={150}
            />
            {errors.assignmentName && (
              <p className="text-xs text-red-400">{errors.assignmentName}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="instructions"
              className="block text-sm font-medium text-gray-200"
            >
              Instructions
            </label>

            <div
              className={`overflow-hidden rounded-xl border bg-[#1A2130] transition-all duration-200 hover:bg-[#1A2130] hover:border-white/20 focus-within:bg-[#1A2130] focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500/50 ${
                errors.instructions ? "border-red-500/50" : "border-white/10"
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
                className="min-h-[140px] w-full resize-y rounded-none border-0 bg-transparent px-4 py-3 text-sm leading-relaxed text-white placeholder:text-gray-500 shadow-none ring-0 transition-none hover:bg-transparent focus:border-0 focus:bg-transparent focus:ring-0 focus:outline-none"
                rows={6}
              />

              {formData.instructionsImageUrl && (
                <div className="mx-3 mb-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    <ImageIcon className="h-3 w-3" />
                    Attachment
                  </div>

                  <div className="rounded-lg overflow-hidden border border-white/10 bg-black/20">
                    <img
                      src={formData.instructionsImageUrl}
                      alt="Assignment instructions"
                      className="w-full max-h-64 object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-white/[0.06] px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <label
                    htmlFor="instructions-image-upload"
                    className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-all duration-200 ${
                      isInstructionsImageBusy
                        ? "text-slate-600 cursor-not-allowed"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] cursor-pointer"
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
                      <div className="h-3.5 w-px bg-white/[0.08]" />

                      <button
                        type="button"
                        onClick={() => void onInstructionsImageRemove()}
                        disabled={isInstructionsImageBusy}
                        className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-red-400/80 hover:text-red-300 hover:bg-red-500/[0.08] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
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
              <p className="text-xs text-red-400">{errors.instructions}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="programmingLanguage"
                className="block text-sm font-medium text-gray-200"
              >
                Programming Language <span className="text-red-400">*</span>
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
                className={`h-11 py-0 bg-[#1A2130] border-white/10 rounded-xl transition-all duration-200 hover:bg-[#1A2130] hover:border-white/20 focus:bg-[#1A2130] focus:ring-blue-500/20 focus:border-blue-500/50 ${
                  formData.programmingLanguage ? "text-white" : "text-gray-500"
                } ${
                  errors.programmingLanguage
                    ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                    : ""
                }`}
                placeholder="Select language"
              />
              {errors.programmingLanguage && (
                <p className="text-xs text-red-400">
                  {errors.programmingLanguage}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="totalScore"
                className="block text-sm font-medium text-gray-200"
              >
                Total Score <span className="text-red-400">*</span>
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
                  disabled={isLoading}
                  className={`h-11 w-full pr-16 bg-[#1A2130] border-white/10 text-white placeholder:text-gray-500 rounded-xl transition-all duration-200 hover:bg-[#1A2130] hover:border-white/20 focus:bg-[#1A2130] focus:ring-blue-500/20 focus:border-blue-500/50 ${
                    errors.totalScore ? "border-red-500/50" : ""
                  }`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium pointer-events-none group-focus-within:text-blue-400 transition-colors">
                  Points
                </div>
              </div>
              {errors.totalScore && (
                <p className="text-xs text-red-400">{errors.totalScore}</p>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePicker
                label="Deadline Date"
                labelClassName="text-gray-200"
                value={formData.deadline}
                triggerStyle={{ backgroundColor: "#1A2130" }}
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
                labelClassName="text-gray-200"
                value={formData.deadline.split("T")[1]?.slice(0, 5) || ""}
                triggerStyle={{ backgroundColor: "#1A2130" }}
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
            <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-orange-400 font-medium uppercase tracking-wider mb-1">
                    Selected Deadline
                  </p>
                  <p className="text-sm text-white font-medium">
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
                  <p className="text-xs text-orange-400 font-medium uppercase tracking-wider mb-1">
                    Time remaining
                  </p>
                  <p className="text-sm font-medium text-white font-mono">
                    {formatTimeRemaining(deadlineDate)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 pt-6 border-t border-white/10">
            <div
              className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                formData.scheduledDate
                  ? "bg-purple-500/10 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-xl transition-colors ${
                    formData.scheduledDate ? "bg-purple-500/20" : "bg-white/5"
                  }`}
                >
                  <Calendar
                    className={`w-5 h-5 ${
                      formData.scheduledDate
                        ? "text-purple-400"
                        : "text-gray-400"
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <h3
                    className={`text-sm font-semibold transition-colors ${
                      formData.scheduledDate ? "text-white" : "text-gray-300"
                    }`}
                  >
                    Scheduled Release
                  </h3>
                  <p className="text-xs text-gray-400">
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
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                  formData.scheduledDate ? "bg-purple-600" : "bg-white/10"
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
                    labelClassName="text-gray-200"
                    required
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
                    labelClassName="text-gray-200"
                    required
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
            <p className="text-xs text-red-400">{errors.deadline}</p>
          )}
        </div>

        <div className="space-y-2 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => setShowTemplateCode(!showTemplateCode)}
            className="flex items-center gap-2 text-sm font-medium text-gray-200 hover:text-white transition-colors"
          >
            <Code className="w-4 h-4" />
            Template Code
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                showTemplateCode ? "rotate-180" : ""
              }`}
            />
          </button>

          {showTemplateCode && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-xs text-gray-300">
                Provide starter/template code that will be excluded from
                similarity analysis. Students won't be flagged for using this
                code.
              </p>

              <div className="rounded-xl overflow-hidden border border-white/10">
                <Editor
                  key={templateCodeMonacoLanguage}
                  height="300px"
                  theme="vs-dark"
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

                <div className="flex items-center justify-between border-t border-white/[0.06] bg-black/20 px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <label
                      htmlFor="template-code-upload"
                      className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] cursor-pointer transition-all duration-200"
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
                        <div className="h-3.5 w-px bg-white/[0.08]" />

                        <button
                          type="button"
                          onClick={() => handleInputChange("templateCode", "")}
                          className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-red-400/80 hover:text-red-300 hover:bg-red-500/[0.08] transition-all duration-200"
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
