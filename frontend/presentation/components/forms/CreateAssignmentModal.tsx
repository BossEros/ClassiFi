/**
 * Create Assignment Modal Component
 * Part of the Presentation Layer - Forms
 * Modal form for creating a new assignment
 */

import { useState, useEffect } from 'react'
import { X, Plus, RefreshCw, FileCode, Calendar, Code } from 'lucide-react'
import { Input } from '@/presentation/components/ui/Input'
import { Textarea } from '@/presentation/components/ui/Textarea'
import { Select, type SelectOption } from '@/presentation/components/ui/Select'
import { Button } from '@/presentation/components/ui/Button'
import { createAssignment, updateAssignment } from '@/business/services/class/classService'
import {
  validateAssignmentTitle,
  validateDescription,
  validateProgrammingLanguage,
  validateDeadline
} from '@/business/validation/assignmentValidation'
import type { Assignment } from '@/business/models/dashboard/types'

interface CreateAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (assignment: Assignment) => void
  classId: number
  teacherId: number
  assignment?: Assignment
}

const programmingLanguageOptions: SelectOption[] = [
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' }
]

export function CreateAssignmentModal({
  isOpen,
  onClose,
  onSuccess,
  classId,
  teacherId,
  assignment
}: CreateAssignmentModalProps) {
  const [assignmentName, setAssignmentName] = useState('')
  const [description, setDescription] = useState('')
  const [programmingLanguage, setProgrammingLanguage] = useState<'python' | 'java' | ''>('')
  const [deadline, setDeadline] = useState('')
  const [allowResubmission, setAllowResubmission] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Field-specific errors
  const [assignmentNameError, setAssignmentNameError] = useState<string | null>(null)
  const [descriptionError, setDescriptionError] = useState<string | null>(null)
  const [programmingLanguageError, setProgrammingLanguageError] = useState<string | null>(null)
  const [deadlineError, setDeadlineError] = useState<string | null>(null)

  // Reset form when modal opens/closes
  // Reset form when modal opens/closes or assignment changes
  useEffect(() => {
    if (isOpen) {
      if (assignment) {
        setAssignmentName(assignment.title)
        setDescription(assignment.description)
        setProgrammingLanguage(assignment.programmingLanguage as 'python' | 'java')
        // Format date for datetime-local input (YYYY-MM-DDThh:mm)
        const date = new Date(assignment.deadline)
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
        setDeadline(date.toISOString().slice(0, 16))
        setAllowResubmission(assignment.allowResubmission)
      } else {
        setAssignmentName('')
        setDescription('')
        setProgrammingLanguage('')
        setDeadline('')
        setAllowResubmission(true)
      }
      setError(null)
      setAssignmentNameError(null)
      setDescriptionError(null)
      setProgrammingLanguageError(null)
      setDeadlineError(null)
    }
  }, [isOpen, assignment])

  // Validation handlers
  const handleAssignmentNameBlur = () => {
    const error = validateAssignmentTitle(assignmentName)
    setAssignmentNameError(error)
  }

  const handleDescriptionBlur = () => {
    const error = validateDescription(description)
    setDescriptionError(error)
  }

  const handleProgrammingLanguageChange = (value: string) => {
    setProgrammingLanguage(value as 'python' | 'java' | '')
    const error = validateProgrammingLanguage(value)
    setProgrammingLanguageError(error)
  }

  const handleDeadlineBlur = () => {
    if (deadline) {
      const error = validateDeadline(new Date(deadline))
      setDeadlineError(error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate all fields
    const nameError = validateAssignmentTitle(assignmentName)
    const descError = validateDescription(description)
    const langError = validateProgrammingLanguage(programmingLanguage)
    const deadError = deadline ? validateDeadline(new Date(deadline)) : 'Deadline is required'

    setAssignmentNameError(nameError)
    setDescriptionError(descError)
    setProgrammingLanguageError(langError)
    setDeadlineError(deadError)

    // If any validation errors, stop
    if (nameError || descError || langError || deadError) {
      return
    }

    try {
      setIsSubmitting(true)

      let resultAssignment: Assignment

      if (assignment) {
        resultAssignment = await updateAssignment(assignment.id, {
          teacherId,
          assignmentName,
          description,
          programmingLanguage: programmingLanguage as 'python' | 'java',
          deadline: new Date(deadline),
          allowResubmission
        })
      } else {
        resultAssignment = await createAssignment({
          classId,
          teacherId,
          assignmentName,
          description,
          programmingLanguage: programmingLanguage as 'python' | 'java',
          deadline: new Date(deadline),
          allowResubmission
        })
      }

      onSuccess(resultAssignment)
      onClose()
    } catch (err) {
      console.error('Failed to save assignment:', err)
      setError(err instanceof Error ? err.message : 'Failed to save coursework')
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
      <div className="relative w-full max-w-lg bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <FileCode className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{assignment ? 'Edit Coursework' : 'Create Coursework'}</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {assignment ? 'Update coursework details' : 'Add new coursework for your students'}
              </p>
            </div>
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

          {/* Assignment Name */}
          <div className="space-y-2">
            <label htmlFor="assignmentName" className="text-sm font-medium text-white">
              Coursework Title <span className="text-red-400">*</span>
            </label>
            <Input
              id="assignmentName"
              type="text"
              placeholder="e.g., Fibonacci Sequence"
              value={assignmentName}
              onChange={(e) => {
                setAssignmentName(e.target.value)
                if (assignmentNameError) setAssignmentNameError(null)
              }}
              onBlur={handleAssignmentNameBlur}
              disabled={isSubmitting}
              className={assignmentNameError ? 'border-red-500/50' : ''}
              maxLength={150}
              required
            />
            {assignmentNameError && (
              <p className="text-sm text-red-400">{assignmentNameError}</p>
            )}
            <p className="text-xs text-gray-500">
              {assignmentName.length}/150 characters
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-white">
              Description <span className="text-red-400">*</span>
            </label>
            <Textarea
              id="description"
              placeholder="Describe what students need to do..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (descriptionError) setDescriptionError(null)
              }}
              onBlur={handleDescriptionBlur}
              disabled={isSubmitting}
              className={descriptionError ? 'border-red-500/50' : ''}
              rows={4}
              required
            />
            {descriptionError && (
              <p className="text-sm text-red-400">{descriptionError}</p>
            )}
            <p className="text-xs text-gray-500">
              Minimum 10 characters
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Programming Language */}
            <div className="space-y-2">
              <label htmlFor="programmingLanguage" className="text-sm font-medium text-white flex items-center gap-2">
                <Code className="w-4 h-4" />
                Programming Language <span className="text-red-400">*</span>
              </label>
              <Select
                id="programmingLanguage"
                options={programmingLanguageOptions}
                value={programmingLanguage}
                onChange={handleProgrammingLanguageChange}
                disabled={isSubmitting}
                className={programmingLanguageError ? 'border-red-500/50' : ''}
                placeholder="Select language"
                required
              />
              {programmingLanguageError && (
                <p className="text-sm text-red-400">{programmingLanguageError}</p>
              )}
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <label htmlFor="deadline" className="text-sm font-medium text-white flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Deadline <span className="text-red-400">*</span>
              </label>
              <Input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => {
                  setDeadline(e.target.value)
                  if (deadlineError) setDeadlineError(null)
                }}
                onBlur={handleDeadlineBlur}
                disabled={isSubmitting}
                className={deadlineError ? 'border-red-500/50' : ''}
                required
              />
              {deadlineError && (
                <p className="text-sm text-red-400">{deadlineError}</p>
              )}
            </div>
          </div>

          {/* Allow Resubmission */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
            <input
              id="allowResubmission"
              type="checkbox"
              checked={allowResubmission}
              onChange={(e) => setAllowResubmission(e.target.checked)}
              disabled={isSubmitting}
              className="w-5 h-5 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-2 focus:ring-purple-500/50 cursor-pointer"
            />
            <label htmlFor="allowResubmission" className="text-sm text-gray-300 cursor-pointer">
              Allow students to resubmit after their first submission
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {assignment ? 'Update Coursework' : 'Create Coursework'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
