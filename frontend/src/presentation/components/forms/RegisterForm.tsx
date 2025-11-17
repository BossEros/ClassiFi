/**
 * Registration Form Component
 * Part of the Presentation Layer - Form Components
 */

import { useState } from 'react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Eye, EyeOff, ArrowLeft, GraduationCap, Users } from 'lucide-react'
import { registerUser } from '@/business/services/auth/authService'
import {
  validateRegistrationData,
  validateField,
  type ValidationResult
} from '@/business/validation/authValidation'
import type {
  RegistrationStep,
  RegistrationStepInfo,
  UserRole
} from '@/business/models/auth/types'

interface RegisterFormProps {
  onSuccess?: () => void
  onBackToLogin?: () => void
}

export function RegisterForm({ onSuccess, onBackToLogin }: RegisterFormProps) {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('role')
  const [role, setRole] = useState<UserRole | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const steps: RegistrationStepInfo[] = [
    { id: 'role', label: 'Role' },
    { id: 'personal', label: 'Personal Details' },
    { id: 'credentials', label: 'Login Credentials' },
    { id: 'complete', label: 'Complete' }
  ]

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep)

  const handleNext = () => {
    setError(null)
    setFieldErrors({})

    if (currentStep === 'role' && role) {
      setCurrentStep('personal')
    } else if (currentStep === 'personal') {
      // Validate personal details
      const errors: Record<string, string> = {}
      const firstNameError = validateField('firstName', firstName)
      const lastNameError = validateField('lastName', lastName)
      const emailError = validateField('email', email)

      if (firstNameError) errors.firstName = firstNameError
      if (lastNameError) errors.lastName = lastNameError
      if (emailError) errors.email = emailError

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        return
      }

      setCurrentStep('credentials')
    } else if (currentStep === 'credentials') {
      // Validate credentials before submission
      handleSubmit()
    }
  }

  const handleBack = () => {
    setError(null)
    setFieldErrors({})

    if (currentStep === 'personal') setCurrentStep('role')
    else if (currentStep === 'credentials') setCurrentStep('personal')
  }

  const handleSubmit = async () => {
    if (!role) return

    setIsLoading(true)
    setError(null)
    setFieldErrors({})

    // Validate all registration data
    const validationResult = validateRegistrationData({
      role,
      firstName,
      lastName,
      email,
      username,
      password,
      confirmPassword
    })

    if (!validationResult.isValid) {
      setFieldErrors(validationResult.errors)
      setIsLoading(false)
      return
    }

    const result = await registerUser({
      role,
      firstName,
      lastName,
      email,
      username,
      password,
      confirmPassword
    })

    setIsLoading(false)

    if (result.success) {
      setCurrentStep('complete')
    } else {
      setError(result.message || 'Registration failed')
    }
  }

  // Handle field blur for real-time validation
  const handleFieldBlur = (fieldName: string, value: string) => {
    const additionalData = fieldName === 'confirmPassword' ? { password } : undefined
    const error = validateField(fieldName, value, additionalData)

    if (error) {
      setFieldErrors(prev => ({ ...prev, [fieldName]: error }))
    } else {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  const canProceed = () => {
    if (currentStep === 'role') return role !== null
    if (currentStep === 'personal') return firstName && lastName && email
    if (currentStep === 'credentials') return username && password && confirmPassword
    return false
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      {currentStep !== 'complete' && (
        <button
          onClick={currentStep === 'role' ? onBackToLogin : handleBack}
          className="flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
      )}

      {/* Progress Stepper */}
      {currentStep !== 'complete' && (
        <div className="space-y-3">
          {/* Step Labels */}
          <div className="flex justify-between text-xs px-1">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`transition-colors ${
                  index === 0
                    ? 'text-left'
                    : index === steps.length - 1
                    ? 'text-right'
                    : 'text-center'
                } ${index <= currentStepIndex ? 'text-white font-medium' : 'text-gray-400'}`}
              >
                {step.label}
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="relative h-1.5 bg-gray-700 rounded-full">
            <div
              className="absolute h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStepIndex / 3) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Step Content - Role Selection */}
      {currentStep === 'role' && (
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">Choose Your Role</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`p-8 rounded-2xl border-2 transition-all ${
                role === 'student'
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <GraduationCap className="w-12 h-12 mx-auto mb-4 text-white" />
              <p className="text-white font-medium">I am a student</p>
            </button>

            <button
              type="button"
              onClick={() => setRole('teacher')}
              className={`p-8 rounded-2xl border-2 transition-all ${
                role === 'teacher'
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <Users className="w-12 h-12 mx-auto mb-4 text-white" />
              <p className="text-white font-medium">I am a teacher</p>
            </button>
          </div>

          <Button onClick={handleNext} disabled={!canProceed()}>
            Next
          </Button>
        </div>
      )}

      {/* Step Content - Personal Details */}
      {currentStep === 'personal' && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">Enter Your Personal Details</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-300">
                First Name
              </label>
              <Input
                id="firstName"
                type="text"
                placeholder="Enter your first name..."
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onBlur={(e) => handleFieldBlur('firstName', e.target.value)}
                required
              />
              {fieldErrors.firstName && (
                <p className="text-sm text-red-400">{fieldErrors.firstName}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-300">
                Last Name
              </label>
              <Input
                id="lastName"
                type="text"
                placeholder="Enter your last name..."
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onBlur={(e) => handleFieldBlur('lastName', e.target.value)}
                required
              />
              {fieldErrors.lastName && (
                <p className="text-sm text-red-400">{fieldErrors.lastName}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={(e) => handleFieldBlur('email', e.target.value)}
              required
            />
            {fieldErrors.email && (
              <p className="text-sm text-red-400">{fieldErrors.email}</p>
            )}
          </div>

          <Button onClick={handleNext} disabled={!canProceed()}>
            Next
          </Button>
        </div>
      )}

      {/* Step Content - Credentials */}
      {currentStep === 'credentials' && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">Set Your Login Credentials</h1>
          </div>

          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-medium text-gray-300">
              Username
            </label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={(e) => handleFieldBlur('username', e.target.value)}
              required
            />
            {fieldErrors.username && (
              <p className="text-sm text-red-400">{fieldErrors.username}</p>
            )}
            <p className="text-xs text-gray-500">Letters, numbers, and underscores only</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={(e) => handleFieldBlur('password', e.target.value)}
                className="pr-11"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-sm text-red-400">{fieldErrors.password}</p>
            )}
            <p className="text-xs text-gray-500">
              Must be 8+ characters with uppercase, lowercase, number, and special character
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
              Confirm Password
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Enter your password again..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={(e) => handleFieldBlur('confirmPassword', e.target.value)}
                className="pr-11"
                required
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

          <Button onClick={handleNext} disabled={!canProceed() || isLoading} className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Creating Account...</span>
              </div>
            ) : (
              'Create My Account'
            )}
          </Button>

          <p className="text-center text-xs text-gray-500">
            By submitting this form, I agree to the{' '}
            <a href="#" className="text-purple-400 hover:text-purple-300">
              Terms and Conditions
            </a>{' '}
            of ClassiFi.
          </p>
        </div>
      )}

      {/* Step Content - Complete */}
      {currentStep === 'complete' && (
        <div className="space-y-8 text-center py-8">
          <div>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 mb-6">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Account Creation Complete</h1>
            <p className="text-gray-400">Click the button to proceed to the home page.</p>
          </div>

          <Button onClick={onSuccess}>Proceed to Home</Button>
        </div>
      )}
    </div>
  )
}
