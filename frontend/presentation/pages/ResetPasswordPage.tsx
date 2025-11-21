/**
 * Reset Password Page
 * Allows users to set a new password after clicking reset link in email
 */

import { useState, useEffect } from 'react'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from 'lucide-react'
import { validatePassword, validatePasswordsMatch } from '@/business/validation/authValidation'
import { resetPassword } from '@/business/services/auth/authService'
import { supabase } from '@/data/api/supabaseClient'

interface ResetPasswordPageProps {
  onSuccess?: () => void
}

export function ResetPasswordPage({ onSuccess }: ResetPasswordPageProps) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [tokenError, setTokenError] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  useEffect(() => {
    // Check if Supabase has automatically established a session from the reset link
    // This happens automatically when detectSessionInUrl is true in supabaseClient config
    let isMounted = true
    let authListener: { data: { subscription: { unsubscribe: () => void } } } | null = null

    const initializeSession = async () => {
      try {
        // Extract tokens from URL hash
        const hash = window.location.hash
        const hashParams = new URLSearchParams(hash.substring(1))
        const searchParams = new URLSearchParams(window.location.search)

        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const tokenType = hashParams.get('type') || searchParams.get('type')
        const urlError = hashParams.get('error') || searchParams.get('error')

        if (urlError) {
          setTokenError(true)
          setError('Invalid or expired reset link. Please request a new password reset.')
          setIsCheckingSession(false)
          return
        }

        if (tokenType !== 'recovery') {
          setTokenError(true)
          setError('Invalid reset link type. Please request a new password reset.')
          setIsCheckingSession(false)
          return
        }

        if (!accessToken || !refreshToken) {
          setTokenError(true)
          setError('Missing required tokens. Please request a new password reset.')
          setIsCheckingSession(false)
          return
        }

        // Manually set the session using the tokens from the URL
        // This is more reliable than relying on detectSessionInUrl
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        })

        if (sessionError) {
          setTokenError(true)
          setError('Unable to establish reset session. The link may have expired. Please request a new password reset.')
          setIsCheckingSession(false)
          return
        }

        // Listen for auth state changes to confirm session is established
        authListener = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!isMounted) return

          // PASSWORD_RECOVERY or SIGNED_IN events indicate session is established
          if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
            if (isMounted) {
              // Clear the hash from URL for security
              window.history.replaceState(null, '', window.location.pathname)
              setIsCheckingSession(false)
            }
          }
        })

        // Verify session was established
        const { data: sessionData } = await supabase.auth.getSession()

        if (sessionData?.session) {
          // Session established successfully
          if (isMounted) {
            // Clear the hash from URL for security
            window.history.replaceState(null, '', window.location.pathname)
            setIsCheckingSession(false)
          }
        } else {
          // This shouldn't happen after setSession succeeds, but handle it just in case
          if (isMounted) {
            setTokenError(true)
            setError('Unable to verify session. Please request a new password reset.')
            setIsCheckingSession(false)
          }
        }

      } catch {
        if (isMounted) {
          setTokenError(true)
          setError('Failed to verify reset link. Please request a new password reset.')
          setIsCheckingSession(false)
        }
      }
    }

    initializeSession()

    return () => {
      isMounted = false
      if (authListener) {
        authListener.data.subscription.unsubscribe()
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    if (tokenError) {
      setError('Invalid reset link. Please request a new password reset.')
      return
    }

    // Validate passwords
    const passwordError = validatePassword(newPassword)
    const confirmError = validatePasswordsMatch(newPassword, confirmPassword)

    const errors: Record<string, string> = {}
    if (passwordError) errors.newPassword = passwordError
    if (confirmError) errors.confirmPassword = confirmError

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setIsLoading(true)

    // Use authService for password reset (follows 3-tier architecture)
    // The repository will check for Supabase session automatically
    const result = await resetPassword({
      newPassword: newPassword,
      confirmPassword: confirmPassword
    })

    setIsLoading(false)

    if (result.success) {
      setSuccess(true)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        onSuccess?.()
      }, 3000)
    } else {
      setError(result.message || 'Failed to reset password')
    }
  }

  const handleFieldBlur = (fieldName: string, value: string) => {
    let error: string | null = null

    if (fieldName === 'newPassword') {
      error = validatePassword(value)
    } else if (fieldName === 'confirmPassword') {
      error = validatePasswordsMatch(newPassword, value)
    }

    if (error) {
      setFieldErrors((prev) => ({ ...prev, [fieldName]: error! }))
    } else {
      setFieldErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Password Reset Complete!</h1>
            <p className="text-gray-300 mb-6">
              Your password has been successfully updated. You can now log in with your new password.
            </p>
            <p className="text-sm text-gray-400">Redirecting to login in 3 seconds...</p>
            <Button onClick={onSuccess} className="w-full mt-6">
              Go to Login Now
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Verifying Reset Link...</h1>
            <p className="text-gray-400">Please wait while we verify your password reset link.</p>
          </div>
        </div>
      </div>
    )
  }

  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Invalid Reset Link</h1>
            <p className="text-gray-300 mb-6">{error}</p>
            <Button onClick={() => (window.location.href = '/forgot-password')} className="w-full">
              Request New Reset Link
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Reset Your Password</h1>
            <p className="text-gray-400">Enter your new password below</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* New Password */}
            <div className="space-y-2">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300">
                New Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onBlur={(e) => handleFieldBlur('newPassword', e.target.value)}
                  className="pl-11 pr-11"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.newPassword && (
                <p className="text-sm text-red-400">{fieldErrors.newPassword}</p>
              )}
              <p className="text-xs text-gray-500">
                Must be 8+ characters with uppercase, lowercase, number, and special character
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={(e) => handleFieldBlur('confirmPassword', e.target.value)}
                  className="pl-11 pr-11"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-sm text-red-400">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Resetting Password...</span>
                </div>
              ) : (
                'Reset Password'
              )}
            </Button>

            {/* Back to Login */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => (window.location.href = '/login')}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
