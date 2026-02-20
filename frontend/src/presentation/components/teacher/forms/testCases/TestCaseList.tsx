import { useState } from "react"
import {
  Plus,
  Trash2,
  Edit2,
  EyeOff,
  ChevronDown,
  FlaskConical,
} from "lucide-react"
import { Button } from "@/presentation/components/ui/Button"
import { TestCaseModal } from "@/presentation/components/teacher/forms/testCases/TestCaseModal"
import { DeleteTestCaseModal } from "@/presentation/components/teacher/forms/testCases/DeleteTestCaseModal"
import type {
  TestCase,
  CreateTestCaseRequest,
  UpdateTestCaseRequest,
} from "@/shared/types/testCase"

// Pending test case (before assignment is created)
export interface PendingTestCase {
  tempId: string // Temporary ID for tracking
  name: string
  input: string
  expectedOutput: string
  isHidden: boolean
  timeLimit: number
  sortOrder: number
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

export function TestCaseList({
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

