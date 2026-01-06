import * as React from 'react'
import { cn } from '@/shared/utils/cn'
import { AlertTriangle, X, Trash2, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { deleteAccount } from '@/business/services/authService'
import { useNavigate } from 'react-router-dom'

interface DeleteAccountModalProps {
    isOpen: boolean
    onClose: () => void
}

export function DeleteAccountModal({
    isOpen,
    onClose
}: DeleteAccountModalProps) {
    const navigate = useNavigate()
    const [password, setPassword] = React.useState('')
    const [confirmation, setConfirmation] = React.useState('')
    const [isDeleting, setIsDeleting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [step, setStep] = React.useState<'warning' | 'confirm' | 'success'>('warning')
    const [showPassword, setShowPassword] = React.useState(false)

    // Reset form when modal opens/closes
    React.useEffect(() => {
        if (!isOpen) {
            setPassword('')
            setConfirmation('')
            setError(null)
            setStep('warning')
        }
    }, [isOpen])

    // Close on escape key
    React.useEffect(() => {
        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape' && !isDeleting) {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, onClose, isDeleting])

    const handleContinue = () => {
        setStep('confirm')
    }

    const handleDelete = async () => {
        setError(null)
        setIsDeleting(true)

        try {
            const result = await deleteAccount({ password, confirmation })

            if (result.success) {
                // Show success message before redirecting
                setStep('success')
                setTimeout(() => {
                    navigate('/', { replace: true })
                }, 3500)
            } else {
                setError(result.message || 'Failed to delete account')
            }
        } catch {
            setError('An unexpected error occurred. Please try again.')
        } finally {
            setIsDeleting(false)
        }
    }

    const isConfirmDisabled = confirmation !== 'DELETE' || !password || isDeleting

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
                    'rounded-xl border border-red-500/20 bg-slate-900/95 backdrop-blur-sm',
                    'shadow-xl shadow-red-500/10',
                    'animate-in fade-in-0 zoom-in-95 duration-200'
                )}
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-account-title"
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    disabled={isDeleting}
                    className={cn(
                        'absolute top-4 right-4 p-1 rounded-lg',
                        'text-gray-400 hover:text-white hover:bg-white/10',
                        'transition-colors duration-200',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center",
                        step === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'
                    )}>
                        {step === 'warning' ? (
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        ) : step === 'confirm' ? (
                            <Trash2 className="w-8 h-8 text-red-400" />
                        ) : (
                            <CheckCircle className="w-8 h-8 text-green-400" />
                        )}
                    </div>
                </div>

                {/* Title */}
                <h2
                    id="delete-account-title"
                    className={cn(
                        "text-xl font-semibold text-center mb-2",
                        step === 'success' ? 'text-green-400' : 'text-white'
                    )}
                >
                    {step === 'warning' ? 'Delete Account?' : step === 'confirm' ? 'Confirm Deletion' : 'Account Deleted'}
                </h2>

                {step === 'warning' ? (
                    <>
                        {/* Warning content */}
                        <p className="text-gray-400 text-center mb-4 text-sm">
                            This action is <span className="text-red-400 font-semibold">permanent and irreversible</span>.
                        </p>

                        <div className="space-y-3 mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                            <p className="text-sm text-gray-300">
                                Deleting your account will permanently remove:
                            </p>
                            <ul className="text-sm text-gray-400 space-y-2">
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-0.5">•</span>
                                    Your profile and personal information
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-0.5">•</span>
                                    All your submissions and coursework
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-0.5">•</span>
                                    Your enrollments in all classes
                                </li>
                            </ul>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className={cn(
                                    'flex-1 px-4 py-3 rounded-xl text-sm font-semibold',
                                    'border border-white/20 text-white',
                                    'hover:bg-white/10 transition-colors duration-200',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500'
                                )}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleContinue}
                                className={cn(
                                    'flex-1 px-4 py-3 rounded-xl text-sm font-semibold',
                                    'bg-red-500/20 border border-red-500/30 text-red-400',
                                    'hover:bg-red-500/30 transition-colors duration-200',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500'
                                )}
                            >
                                Continue
                            </button>
                        </div>
                    </>
                ) : step === 'confirm' ? (
                    <>
                        {/* Confirmation form */}
                        <p className="text-gray-400 text-center mb-6 text-sm">
                            Please confirm your decision by entering your password and typing <span className="text-red-400 font-mono font-semibold">DELETE</span>.
                        </p>

                        <div className="space-y-4">
                            {/* Error message */}
                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                                    <p className="text-sm text-red-400">{error}</p>
                                </div>
                            )}

                            {/* Password */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">
                                    Your Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value)
                                            setError(null)
                                        }}
                                        className={cn(
                                            'w-full px-4 py-3 pr-12 rounded-lg',
                                            'bg-black/20 border border-white/10',
                                            'text-white placeholder-gray-500',
                                            'focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent',
                                            'transition-all duration-200'
                                        )}
                                        placeholder="Enter your password"
                                        disabled={isDeleting}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Type DELETE */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">
                                    Type <span className="text-red-400 font-mono">DELETE</span> to confirm
                                </label>
                                <input
                                    type="text"
                                    value={confirmation}
                                    onChange={(e) => {
                                        setConfirmation(e.target.value.toUpperCase())
                                        setError(null)
                                    }}
                                    className={cn(
                                        'w-full px-4 py-3 rounded-lg font-mono',
                                        'bg-black/20 border border-white/10',
                                        'text-white placeholder-gray-500',
                                        'focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent',
                                        'transition-all duration-200',
                                        confirmation === 'DELETE' && 'border-red-500/50'
                                    )}
                                    placeholder="DELETE"
                                    disabled={isDeleting}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setStep('warning')}
                                    disabled={isDeleting}
                                    className={cn(
                                        'flex-1 px-4 py-3 rounded-xl text-sm font-semibold',
                                        'border border-white/20 text-white',
                                        'hover:bg-white/10 transition-colors duration-200',
                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500',
                                        'disabled:opacity-50 disabled:cursor-not-allowed'
                                    )}
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isConfirmDisabled}
                                    className={cn(
                                        'flex-1 px-4 py-3 rounded-xl text-sm font-semibold',
                                        'bg-red-600 text-white',
                                        'hover:bg-red-700 transition-colors duration-200',
                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500',
                                        'disabled:opacity-50 disabled:cursor-not-allowed'
                                    )}
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete My Account'}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Success message */}
                        <p className="text-gray-400 text-center mb-6 text-sm">
                            Your account has been permanently deleted. All your data has been removed.
                        </p>
                        <p className="text-gray-500 text-center text-xs">
                            Redirecting to home page...
                        </p>
                    </>
                )}
            </div>
        </div>
    )
}
