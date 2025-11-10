import { useState } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Eye, EyeOff, ArrowLeft, GraduationCap, Users } from 'lucide-react'

type Step = 'role' | 'personal' | 'credentials' | 'complete'
type Role = 'student' | 'instructor' | null

interface RegisterProps {
  onBackToLogin?: () => void
}

export default function Register({ onBackToLogin }: RegisterProps) {
  const [currentStep, setCurrentStep] = useState<Step>('role')
  const [role, setRole] = useState<Role>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const steps = [
    { id: 'role', label: 'Role' },
    { id: 'personal', label: 'Personal Details' },
    { id: 'credentials', label: 'Login Credentials' },
    { id: 'complete', label: 'Complete' },
  ]

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep)

  const handleNext = () => {
    if (currentStep === 'role' && role) {
      setCurrentStep('personal')
    } else if (currentStep === 'personal' && firstName && lastName && email) {
      setCurrentStep('credentials')
    } else if (currentStep === 'credentials' && username && password && confirmPassword) {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep === 'personal') setCurrentStep('role')
    else if (currentStep === 'credentials') setCurrentStep('personal')
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      console.log('Registration:', { role, firstName, lastName, email, username, password })
      setIsLoading(false)
      setCurrentStep('complete')
    }, 1500)
  }

  const canProceed = () => {
    if (currentStep === 'role') return role !== null
    if (currentStep === 'personal') return firstName && lastName && email
    if (currentStep === 'credentials') return username && password && confirmPassword
    return false
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Registration Card */}
      <div className="w-full max-w-2xl relative">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 md:p-10 space-y-8">
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
                      index === 0 ? 'text-left' : index === steps.length - 1 ? 'text-right' : 'text-center'
                    } ${
                      index <= currentStepIndex ? 'text-white font-medium' : 'text-gray-400'
                    }`}
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

          {/* Step Content */}
          {currentStep === 'role' && (
            <div className="space-y-8">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-white">Choose Your Role</h1>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
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
                  onClick={() => setRole('instructor')}
                  className={`p-8 rounded-2xl border-2 transition-all ${
                    role === 'instructor'
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <Users className="w-12 h-12 mx-auto mb-4 text-white" />
                  <p className="text-white font-medium">I am an instructor</p>
                </button>
              </div>

              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
              </Button>
            </div>
          )}

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
                    required
                  />
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
                    required
                  />
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
                  required
                />
              </div>

              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
              </Button>
            </div>
          )}

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
                  required
                />
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

              <Button onClick={() => (window.location.href = '/')}>Proceed to Home</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
