import { useState } from 'react'
import { X, LogOut, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/presentation/components/ui/Button'
import { leaveClass } from '@/business/services/dashboard/studentDashboardService'

interface LeaveClassModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  studentId: number
  classId: number
  className: string
}

export function LeaveClassModal({
  isOpen,
  onClose,
  onSuccess,
  studentId,
  classId,
  className
}: LeaveClassModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await leaveClass(studentId, classId)

      if (!response.success) {
        setError(response.message || 'Failed to leave class')
        return
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError('Failed to leave class. Please try again.')
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
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Leave Class</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                This action cannot be undone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
            aria-label="Close"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Warning Message */}
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-sm text-yellow-200">
              Are you sure you want to leave{' '}
              <span className="font-semibold text-white">{className}</span>?
            </p>
            <ul className="mt-3 space-y-2 text-xs text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">•</span>
                <span>You will lose access to all class assignments and materials</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">•</span>
                <span>Your submissions will still be visible to your teacher</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">•</span>
                <span>You will need a new class code to rejoin later</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
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
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 mr-2" />
              )}
              Leave Class
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
