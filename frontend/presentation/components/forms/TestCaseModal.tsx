import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, Eye, EyeOff, Terminal } from "lucide-react"
import { Button } from "@/presentation/components/ui/Button"
import { Input } from "@/presentation/components/ui/Input"
import { Textarea } from "@/presentation/components/ui/Textarea"
import { cn } from "@/shared/utils/cn"
import type {
  TestCase,
  CreateTestCaseRequest,
  UpdateTestCaseRequest,
} from "@/shared/types/testCase"

// Extended type for test cases that may be pending (not yet persisted)
type EditableTestCase = TestCase & { tempId?: string }

interface TestCaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreateTestCaseRequest | UpdateTestCaseRequest) => Promise<void>
  testCase?: EditableTestCase | null
  defaultName?: string
  isLoading?: boolean
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

  const [formData, setFormData] = useState({
    name: "",
    input: "",
    expectedOutput: "",
    isHidden: false,
    timeLimit: 5,
  })

  const [errors, setErrors] = useState<{
    name?: string
    expectedOutput?: string
  }>({})

  // Reset form when modal opens or testCase changes
  useEffect(() => {
    const initializeForm = () => {
      if (testCase) {
        setFormData({
          name: testCase.name || "",
          input: testCase.input || "",
          expectedOutput: testCase.expectedOutput || "",
          isHidden: testCase.isHidden ?? false,
          timeLimit: testCase.timeLimit ?? 5,
        })
      } else {
        setFormData({
          name: defaultName,
          input: "",
          expectedOutput: "",
          isHidden: false,
          timeLimit: 5,
        })
      }
      setErrors({})
    }

    if (isOpen) {
      initializeForm()
    }
  }, [isOpen, testCase, defaultName])

  const handleChange = (
    field: keyof typeof formData,
    value: string | number | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = (): boolean => {
    const newErrors: typeof errors = {}

    if (formData.name.length > 100) {
      newErrors.name = "Name must be 100 characters or less"
    }

    if (!formData.expectedOutput.trim()) {
      newErrors.expectedOutput = "Expected output is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation() // Prevent event from bubbling to parent forms

    if (isLoading) return

    if (!validate()) return

    await onSave({
      name: formData.name.trim(),
      input: formData.input,
      expectedOutput: formData.expectedOutput,
      isHidden: formData.isHidden,
      timeLimit: formData.timeLimit,
    })
  }

  if (!isOpen) return null

  // Use portal to render modal outside parent form
  const modalContent = (
    <div
      className="fixed inset-0 z-[10000] grid place-items-center p-4"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[560px] min-w-[320px] mx-auto bg-[#161926] border border-white/15 rounded-xl shadow-[0_8px_60px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.06)] animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh] flex-shrink-0">
        {/* Header */}
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

        {/* Scrollable Form Content */}
        <div className="overflow-y-auto p-5">
          <form
            id="test-case-form"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Name Field */}
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
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                disabled={isLoading}
                maxLength={100}
                className={cn(
                  "bg-[#1A2130] border-white/10 text-white placeholder:text-gray-500 hover:bg-[#1A2130] hover:border-white/20 focus:bg-[#1A2130] focus:ring-blue-500/20 focus:border-blue-500/50",
                  errors.name && "border-red-500/50",
                )}
              />
              {errors.name && (
                <p className="text-xs text-red-400">{errors.name}</p>
              )}
              {!errors.name && (
                <p className="text-xs text-gray-500">
                  Leave empty to auto-name this case.
                </p>
              )}
            </div>

            {/* Input & Output - Stacked */}
            <div className="space-y-3">
              {/* Input */}
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
                  value={formData.input}
                  onChange={(e) => handleChange("input", e.target.value)}
                  disabled={isLoading}
                  className="min-h-[88px] resize-none font-mono text-sm bg-[#1A2130] border-white/10 text-white placeholder:text-gray-500 hover:bg-[#1A2130] hover:border-white/20 focus:bg-[#1A2130] focus:ring-blue-500/20 focus:border-blue-500/50"
                />
              </div>

              {/* Output */}
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
                  value={formData.expectedOutput}
                  onChange={(e) =>
                    handleChange("expectedOutput", e.target.value)
                  }
                  disabled={isLoading}
                  className={cn(
                    "min-h-[88px] resize-none font-mono text-sm bg-[#1A2130] border-white/10 text-white placeholder:text-gray-500 hover:bg-[#1A2130] hover:border-white/20 focus:bg-[#1A2130] focus:ring-blue-500/20 focus:border-blue-500/50",
                    errors.expectedOutput && "border-red-500/50",
                  )}
                />
                {errors.expectedOutput && (
                  <p className="text-xs text-red-400">
                    {errors.expectedOutput}
                  </p>
                )}
              </div>
            </div>

            {/* Visibility Setting - Improved UI */}
            <div className="pt-1">
              <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                Configuration
              </label>
              <div
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group",
                  formData.isHidden
                    ? "bg-amber-500/[0.08] border-amber-500/30"
                    : "bg-white/[0.03] border-white/10 hover:bg-white/[0.05]",
                )}
                onClick={() => handleChange("isHidden", !formData.isHidden)}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {formData.isHidden ? (
                      <EyeOff className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-teal-400" />
                    )}
                    <span
                      className={cn(
                        "text-sm font-medium transition-colors",
                        formData.isHidden ? "text-amber-200" : "text-gray-200",
                      )}
                    >
                      {formData.isHidden
                        ? "Hidden Test Case"
                        : "Visible Test Case"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                    {formData.isHidden
                      ? "Input and output are hidden from students."
                      : "Students can see the input and expected output."}
                  </p>
                </div>

                {/* Switch Toggle */}
                <div
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors duration-200",
                    formData.isHidden ? "bg-amber-500" : "bg-gray-600",
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200",
                      formData.isHidden ? "left-6" : "left-1",
                    )}
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
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

  // Render modal using portal to escape parent form context
  return createPortal(modalContent, document.body)
}
