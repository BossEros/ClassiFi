/**
 * Forgot Password Form Component
 * Part of the Presentation Layer - Form Components
 */

import { useState } from 'react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react'
import { requestPasswordReset } from '@/business/services/auth/authService'

interface ForgotPasswordFormProps {
  onBackToLoginClick?: () => void
}

export function ForgotPasswordForm({ onBackToLoginClick }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const result = await requestPasswordReset({ email })

    setIsLoading(false)

    if (result.success) {
      setIsSuccess(true)
    } else {
      setError(result.message || 'Failed to process request')
    }
  }

  // Success state view
  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white">Check your email</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            If an account exists with <span className="text-white font-medium">{email}</span>,
            you will receive password reset instructions shortly.
          </p>
        </div>

        <div className="pt-4">
          <p className="text-sm text-gray-400 mb-4">
            Didn't receive an email? Check your spam folder or try again.
          </p>

          <Button
            type="button"
            onClick={() => {
              setIsSuccess(false)
              setEmail('')
            }}
            className="w-full mb-3 bg-white/5 hover:bg-white/10 from-transparent to-transparent border border-white/10"
          >
            Try another email
          </Button>

          <button
            type="button"
            onClick={onBackToLoginClick}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium"
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  // Form view
  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Instructions */}
      <p className="text-gray-400 text-sm leading-relaxed">
        Enter your email address and we'll send you instructions to reset your password.
      </p>

      {/* Email Field */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-gray-300">
          Email address
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Mail className="w-5 h-5" />
          </div>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-11"
            required
            aria-required="true"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full group" disabled={isLoading}>
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Sending...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <span>Send reset instructions</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </Button>

      {/* Divider */}
      <div className="border-t border-gray-700"></div>

      {/* Back to Login Link */}
      <div className="text-center">
        <p className="text-sm text-gray-400">
          Remember your password?{' '}
          <button
            type="button"
            onClick={onBackToLoginClick}
            className="text-purple-400 hover:text-purple-300 transition-colors font-semibold hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </form>
  )
}
