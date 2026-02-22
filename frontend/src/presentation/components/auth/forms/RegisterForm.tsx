import { useState } from "react"
import { Input } from "@/presentation/components/ui/Input"
import { Button } from "@/presentation/components/ui/Button"
import { Eye, EyeOff, ArrowLeft, GraduationCap, Users } from "lucide-react"
import { registerUser } from "@/business/services/authService"
import { useZodForm } from "@/presentation/hooks/shared/useZodForm"
import {
  registerFormSchema,
  type RegisterFormValues,
} from "@/presentation/schemas/auth/authSchemas"
import type { RegistrationStep, RegistrationStepInfo } from "@/shared/types/auth"

interface RegisterFormProps {
  onSuccess?: () => void
  onBackToLogin?: () => void
}

export function RegisterForm({ onSuccess, onBackToLogin }: RegisterFormProps) {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>("role")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    clearErrors,
    formState: { errors },
  } = useZodForm({
    schema: registerFormSchema,
    defaultValues: {
      role: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onSubmit",
  })

  const roleValue = watch("role")
  const firstNameValue = watch("firstName")
  const lastNameValue = watch("lastName")
  const emailValue = watch("email")
  const passwordValue = watch("password")
  const confirmPasswordValue = watch("confirmPassword")

  const firstNameField = register("firstName")
  const lastNameField = register("lastName")
  const emailField = register("email")
  const passwordField = register("password")
  const confirmPasswordField = register("confirmPassword")

  const steps: RegistrationStepInfo[] = [
    { id: "role", label: "Role" },
    { id: "personal", label: "Personal Details" },
    { id: "credentials", label: "Login Credentials" },
    { id: "complete", label: "Complete" },
  ]

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep)

  const handleRegisterSubmit = async (formValues: RegisterFormValues) => {
    setIsLoading(true)
    setError(null)

    const result = await registerUser({
      role: formValues.role,
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      email: formValues.email,
      password: formValues.password,
      confirmPassword: formValues.confirmPassword,
    })

    setIsLoading(false)

    if (result.success) {
      setCurrentStep("complete")
    } else {
      setError(result.message || "Registration failed")
    }
  }

  const handleNext = async () => {
    setError(null)

    if (currentStep === "role") {
      const isRoleStepValid = await trigger("role")

      if (isRoleStepValid) {
        setCurrentStep("personal")
      }

      return
    }

    if (currentStep === "personal") {
      const isPersonalStepValid = await trigger(["firstName", "lastName", "email"])

      if (isPersonalStepValid) {
        setCurrentStep("credentials")
      }

      return
    }

    if (currentStep === "credentials") {
      await handleSubmit(handleRegisterSubmit)()
    }
  }

  const handleBack = () => {
    setError(null)
    clearErrors()

    if (currentStep === "personal") {
      setCurrentStep("role")
    } else if (currentStep === "credentials") {
      setCurrentStep("personal")
    }
  }

  const canProceed = (): boolean => {
    if (currentStep === "role") {
      return roleValue.trim().length > 0
    }

    if (currentStep === "personal") {
      return Boolean(firstNameValue && lastNameValue && emailValue)
    }

    if (currentStep === "credentials") {
      return Boolean(passwordValue && confirmPasswordValue)
    }

    return false
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      {currentStep !== "complete" && (
        <button
          onClick={currentStep === "role" ? onBackToLogin : handleBack}
          className="flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
      )}

      {/* Progress Stepper */}
      {currentStep !== "complete" && (
        <div className="space-y-3">
          {/* Step Labels */}
          <div className="flex justify-between text-xs px-1">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`transition-colors ${
                  index === 0
                    ? "text-left"
                    : index === steps.length - 1
                      ? "text-right"
                      : "text-center"
                } ${index <= currentStepIndex ? "text-white font-medium" : "text-gray-400"}`}
              >
                {step.label}
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="relative h-1.5 bg-gray-700 rounded-full">
            <div
              className="absolute h-full bg-gradient-to-r from-teal-600 to-teal-500 rounded-full transition-all duration-500 ease-out"
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
      {currentStep === "role" && (
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">Choose Your Role</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setValue("role", "student", {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                })
              }}
              className={`p-8 rounded-2xl border-2 transition-all ${
                roleValue === "student"
                  ? "border-teal-500 bg-teal-500/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <GraduationCap className="w-12 h-12 mx-auto mb-4 text-white" />
              <p className="text-white font-medium">I am a student</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setValue("role", "teacher", {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                })
              }}
              className={`p-8 rounded-2xl border-2 transition-all ${
                roleValue === "teacher"
                  ? "border-teal-500 bg-teal-500/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <Users className="w-12 h-12 mx-auto mb-4 text-white" />
              <p className="text-white font-medium">I am a teacher</p>
            </button>
          </div>

          <Button onClick={() => void handleNext()} disabled={!canProceed()}>
            Next
          </Button>
        </div>
      )}

      {/* Step Content - Personal Details */}
      {currentStep === "personal" && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">
              Enter Your Personal Details
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-slate-300"
              >
                First Name
              </label>
              <Input
                id="firstName"
                type="text"
                placeholder="Enter your first name..."
                {...firstNameField}
                onBlur={(event) => {
                  firstNameField.onBlur(event)
                  void trigger("firstName")
                }}
                required
                hasError={!!errors.firstName}
                aria-describedby={errors.firstName ? "firstName-error" : undefined}
              />
              {errors.firstName && (
                <p id="firstName-error" className="text-sm text-red-400" role="alert">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-slate-300"
              >
                Last Name
              </label>
              <Input
                id="lastName"
                type="text"
                placeholder="Enter your last name..."
                {...lastNameField}
                onBlur={(event) => {
                  lastNameField.onBlur(event)
                  void trigger("lastName")
                }}
                required
                hasError={!!errors.lastName}
                aria-describedby={errors.lastName ? "lastName-error" : undefined}
              />
              {errors.lastName && (
                <p id="lastName-error" className="text-sm text-red-400" role="alert">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-300"
            >
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address..."
              {...emailField}
              onBlur={(event) => {
                emailField.onBlur(event)
                void trigger("email")
              }}
              required
              hasError={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-red-400" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <Button onClick={() => void handleNext()} disabled={!canProceed()}>
            Next
          </Button>
        </div>
      )}

      {/* Step Content - Credentials */}
      {currentStep === "credentials" && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">Set Your Password</h1>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-300"
            >
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password..."
                {...passwordField}
                onBlur={(event) => {
                  passwordField.onBlur(event)
                  void trigger("password")
                }}
                className="pr-11"
                required
                hasError={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-sm text-red-400" role="alert">
                {errors.password.message}
              </p>
            )}
            <p className="text-xs text-slate-400">
              Must be 8+ characters with uppercase, lowercase, number, and
              special character
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-slate-300"
            >
              Confirm Password
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Enter your password again..."
                {...confirmPasswordField}
                onBlur={(event) => {
                  confirmPasswordField.onBlur(event)
                  void trigger("confirmPassword")
                }}
                className="pr-11"
                required
                hasError={!!errors.confirmPassword}
                aria-describedby={
                  errors.confirmPassword ? "confirmPassword-error" : undefined
                }
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p
                id="confirmPassword-error"
                className="text-sm text-red-400"
                role="alert"
              >
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            onClick={() => void handleNext()}
            disabled={!canProceed()}
            isLoading={isLoading}
            className="mt-6"
          >
            {isLoading ? "Creating Account..." : "Create My Account"}
          </Button>

          <p className="text-center text-xs text-slate-400">
            By submitting this form, I agree to the{" "}
            <a href="#" className="text-teal-400 hover:text-teal-300">
              Terms and Conditions
            </a>{" "}
            of ClassiFi.
          </p>
        </div>
      )}

      {/* Step Content - Complete */}
      {currentStep === "complete" && (
        <div className="space-y-8 text-center py-8">
          <div>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 mb-6">
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
            <h1 className="text-3xl font-bold text-white mb-2">
              Account Creation Complete
            </h1>
            <p className="text-gray-400">
              Click the button to proceed to the login page.
            </p>
          </div>

          <Button onClick={onSuccess}>Proceed to Login</Button>
        </div>
      )}
    </div>
  )
}
