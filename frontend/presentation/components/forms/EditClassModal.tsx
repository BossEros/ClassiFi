import { useState, useEffect } from 'react'
import { X, Check, RefreshCw } from 'lucide-react'
import { Input } from '@/presentation/components/ui/Input'
import { Textarea } from '@/presentation/components/ui/Textarea'
import { Button } from '@/presentation/components/ui/Button'
import { updateClass } from '@/business/services/classService'
import type { Class } from '@/business/models/dashboard/types'

interface EditClassModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  teacherId: number
  classData: Class
}

export function EditClassModal({ isOpen, onClose, onSuccess, teacherId, classData }: EditClassModalProps) {
  const [className, setClassName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Populate form with class data when modal opens
  useEffect(() => {
    if (isOpen && classData) {
      setClassName(classData.className)
      setDescription(classData.description || '')
      setError(null)
    }
  }, [isOpen, classData])

  // Check if any changes have been made
  const hasChanges =
    className.trim() !== classData.className ||
    (description.trim() || '') !== (classData.description || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!className.trim()) {
      setError('Class name is required')
      return
    }

    // Determine which fields changed
    const nameChanged = className.trim() !== classData.className
    const descriptionChanged = (description.trim() || '') !== (classData.description || '')

    setIsSubmitting(true)
    try {
      await updateClass(classData.id, {
        teacherId,
        className: nameChanged ? className.trim() : undefined,
        description: descriptionChanged ? description.trim() : undefined
      })
      onSuccess()
      onClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update class. Please try again.'
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
            <h2 className="text-2xl font-bold text-white">Edit Class</h2>
            <p className="text-sm text-gray-400 mt-1">
              Update your class information.
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
              onChange={(e) => setClassName(e.target.value)}
              disabled={isSubmitting}
              required
            />
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
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={4}
            />
          </div>

          {/* Class Code (Read-only) */}
          <div className="space-y-2">
            <label htmlFor="classCode" className="text-sm font-medium text-white">
              Class Code
            </label>
            <Input
              id="classCode"
              type="text"
              value={classData.classCode}
              readOnly
              className="bg-white/5 text-gray-400 cursor-not-allowed"
              disabled
            />
            <p className="text-xs text-gray-500">
              * Class code cannot be changed after creation
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
              disabled={isSubmitting || !className.trim() || !hasChanges}
              className="flex-1"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
