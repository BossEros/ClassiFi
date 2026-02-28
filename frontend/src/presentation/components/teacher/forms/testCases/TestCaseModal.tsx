import { useEffect } from "react"
import { createPortal } from "react-dom"
import { X, Eye, EyeOff, Terminal } from "lucide-react"
import { Button } from "@/presentation/components/ui/Button"
import { Input } from "@/presentation/components/ui/Input"
import { Textarea } from "@/presentation/components/ui/Textarea"
import { useZodForm } from "@/presentation/hooks/shared/useZodForm"
import {
  testCaseFormSchema,
  type TestCaseFormValues,
} from "@/presentation/schemas/assignment/assignmentSchemas"
import { cn } from "@/shared/utils/cn"
import type {
  TestCase,
  CreateTestCaseRequest,
  UpdateTestCaseRequest,
} from "@/shared/types/testCase"

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
