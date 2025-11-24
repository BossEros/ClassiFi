/**
 * Delete Class Modal Component
 * Part of the Presentation Layer - Form Components
 */

import * as React from 'react'
import { cn } from '@/shared/utils/cn'
import { Button } from '@/presentation/components/ui/Button'
import { AlertTriangle, X } from 'lucide-react'

interface DeleteClassModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  className?: string
  isDeleting?: boolean
}

export function DeleteClassModal({
  isOpen,
  onClose,
  onConfirm,
  className,
  isDeleting = false
}: DeleteClassModalProps) {
  // Close on escape key
  React.useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isDeleting) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose, isDeleting])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isDeleting ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full max-w-md mx-4 p-6',
          'rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-sm',
          'shadow-xl shadow-black/20',
          'animate-in fade-in-0 zoom-in-95 duration-200',
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isDeleting}
          className={cn(
            'absolute top-4 right-4 p-1 rounded-lg',
            'text-gray-400 hover:text-white hover:bg-white/10',
            'transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500',
            'disabled:opacity-50 disabled:cursor-not-allowed'
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
          id="delete-modal-title"
          className="text-xl font-semibold text-white text-center mb-2"
        >
          Delete Class
        </h2>

        {/* Description */}
        <p className="text-gray-400 text-center mb-6">
          Are you sure you want to delete this class? This action cannot be undone.
          All assignments and student enrollments will be removed.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className={cn(
              'flex-1 px-4 py-3 rounded-xl text-sm font-semibold',
              'border border-white/20 text-white',
              'hover:bg-white/10 transition-colors duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={cn(
              'flex-1 px-4 py-3 rounded-xl text-sm font-semibold',
              'bg-red-500 text-white',
              'hover:bg-red-600 transition-colors duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isDeleting ? 'Deleting...' : 'Delete Class'}
          </button>
        </div>
      </div>
    </div>
  )
}
