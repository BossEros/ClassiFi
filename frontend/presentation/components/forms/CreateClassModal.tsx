import { useState, useEffect } from 'react'
import { X, Check, RefreshCw } from 'lucide-react'
import { Input } from '@/presentation/components/ui/Input'
import { Textarea } from '@/presentation/components/ui/Textarea'
import { Button } from '@/presentation/components/ui/Button'
import { createClass, generateClassCode } from '@/business/services/classService'
import { validateClassName, validateClassDescription, validateCreateClassData } from '@/business/validation/classValidation'

interface CreateClassModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  teacherId: number
}

export function CreateClassModal({ isOpen, onClose, onSuccess, teacherId }: CreateClassModalProps) {
  const [className, setClassName] = useState('')
  const [description, setDescription] = useState('')
  const [classCode, setClassCode] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [classNameError, setClassNameError] = useState<string | null>(null)
  const [descriptionError, setDescriptionError] = useState<string | null>(null)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setClassName('')
      setDescription('')
      setClassCode('')
      setError(null)
      setClassNameError(null)
      setDescriptionError(null)
    }
  }, [isOpen])

  // Validate field on blur
  const handleClassNameBlur = () => {
    const error = validateClassName(className)
    setClassNameError(error)
  }

  const handleDescriptionBlur = () => {
    const error = validateClassDescription(description)
    setDescriptionError(error)
  }

  const handleGenerateCode = async () => {
    setIsGenerating(true)
    setError(null)
    try {
      const code = await generateClassCode()
      setClassCode(code)
    } catch {
      setError('Failed to generate class code')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate all fields
    const validation = validateCreateClassData({ className, description })

    if (!validation.isValid) {
      setClassNameError(validation.errors.className || null)
      setDescriptionError(validation.errors.description || null)
      return
    }

    // Validate class code is generated
    if (!classCode) {
      setError('Please generate a class code')
      return
    }

    // Clear field errors
    setClassNameError(null)
    setDescriptionError(null)

    setIsSubmitting(true)
    try {
      await createClass({
        teacherId,
        className: className.trim(),
        description: description.trim() || undefined,
        classCode
      })
      onSuccess()
      onClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create class. Please try again.'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white">Create Class</h2>
            <p className="text-sm text-gray-400 mt-1">
              Set up a class for your students to submit their coursework.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Class Name */}
          <div className="space-y-2">
            <label htmlFor="className" className="text-sm font-medium text-white">
              Class Name
            </label>
            <Input
              id="className"
              type="text"
              placeholder="Enter course name..."
              value={className}
              onChange={(e) => {
                setClassName(e.target.value)
                if (classNameError) setClassNameError(null)
              }}
              onBlur={handleClassNameBlur}
              disabled={isSubmitting}
              required
              className={classNameError ? 'border-red-500/50' : ''}
            />
            {classNameError && (
              <p className="text-xs text-red-400">{classNameError}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-white">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="Enter course description..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (descriptionError) setDescriptionError(null)
              }}
              onBlur={handleDescriptionBlur}
              disabled={isSubmitting}
              rows={4}
              className={descriptionError ? 'border-red-500/50' : ''}
            />
            {descriptionError && (
              <p className="text-xs text-red-400">{descriptionError}</p>
            )}
          </div>

          {/* Class Code */}
          <div className="space-y-2">
            <label htmlFor="classCode" className="text-sm font-medium text-white">
              Class Code
            </label>
            <div className="flex gap-2">
              <Input
                id="classCode"
                type="text"
                value={classCode}
                placeholder="Click Generate"
                readOnly
                className="flex-1 bg-white/5"
                disabled={isSubmitting}
              />
              <Button
                type="button"
                onClick={handleGenerateCode}
                disabled={isGenerating || isSubmitting}
                className="w-auto px-4 bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  'Generate'
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              * Click Generate to create a class code. Students will use this code to join.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !className.trim() || !classCode || !!classNameError || !!descriptionError}
              className="flex-1"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Confirm
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

