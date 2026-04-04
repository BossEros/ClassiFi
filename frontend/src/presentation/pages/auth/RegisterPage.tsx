import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Input } from "@/presentation/components/ui/Input";
import { Button } from "@/presentation/components/ui/Button";
import { Eye, EyeOff, ArrowLeft, ArrowRight, GraduationCap, Users, Check, CheckCircle2 } from "lucide-react";
import { registerUser } from "@/business/services/authService";
import { useZodForm } from "@/presentation/hooks/shared/useZodForm";
import { registerFormSchema, type RegisterFormValues } from "@/presentation/schemas/auth/authSchemas";
import type { RegistrationStep, RegistrationStepInfo } from "@/data/api/auth.types";
import { authTheme } from "@/presentation/constants/authTheme";

// Inlined from src/presentation/components/auth/forms/RegisterForm.tsx
interface RegisterFormProps {
  onSuccess?: () => void
  onBackToLogin?: () => void
}



function RegisterForm({ onSuccess, onBackToLogin }: RegisterFormProps) {
  const authInputClassName =
    authTheme.input

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

    try {
      const result = await registerUser({
        role: formValues.role,
        firstName: formValues.firstName,
        lastName: formValues.lastName,
        email: formValues.email,
        password: formValues.password,
        confirmPassword: formValues.confirmPassword,
      })

      if (result.success) {
        setCurrentStep("complete")
      } else {
        setError(result.message || "Registration failed")
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Registration failed",
      )
    } finally {
      setIsLoading(false)
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
      const isPersonalStepValid = await trigger([
        "firstName",
        "lastName",
        "email",
      ])

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
          className={authTheme.backButton}
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
                } ${index <= currentStepIndex ? "font-medium text-[#13211E]" : "text-[#6A817A]"}`}
              >
                {step.label}
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className={authTheme.progressTrack}>
            <div
              className={authTheme.progressFill}
              style={{ width: `${(currentStepIndex / 3) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className={authTheme.errorAlert}>
          {error}
        </div>
      )}

      {/* Step Content - Role Selection */}
      {currentStep === "role" && (
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#13211E]">Choose Your Role</h1>
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
              className={`${authTheme.roleCardBase} ${
                roleValue === "student"
                  ? authTheme.roleCardSelected
                  : authTheme.roleCardDefault
              }`}
            >
              {roleValue === "student" && (
                <span className={authTheme.selectedBadge}>
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  Selected
                </span>
              )}
              <div
                className={`${authTheme.roleIconShell} ${
                  roleValue === "student" ? authTheme.roleIconShellSelected : ""
                }`}
              >
                <GraduationCap
                  className={`relative z-10 h-8 w-8 ${
                    roleValue === "student" ? "text-teal-700" : "text-[#35514A]"
                  }`}
                />
              </div>
              <p className="font-medium text-[#13211E]">I am a student</p>
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
              className={`${authTheme.roleCardBase} ${
                roleValue === "teacher"
                  ? authTheme.roleCardSelected
                  : authTheme.roleCardDefault
              }`}
            >
              {roleValue === "teacher" && (
                <span className={authTheme.selectedBadge}>
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  Selected
                </span>
              )}
              <div
                className={`${authTheme.roleIconShell} ${
                  roleValue === "teacher" ? authTheme.roleIconShellSelected : ""
                }`}
              >
                <Users
                  className={`relative z-10 h-8 w-8 ${
                    roleValue === "teacher" ? "text-teal-700" : "text-[#35514A]"
                  }`}
                />
              </div>
              <p className="font-medium text-[#13211E]">I am a teacher</p>
            </button>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              onClick={() => void handleNext()}
              disabled={!canProceed()}
              className="px-8 flex items-center gap-2 transition-transform hover:translate-x-1"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step Content - Personal Details */}
      {currentStep === "personal" && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#13211E]">
              Enter Your Personal Details
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="firstName"
                className={authTheme.label}
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
                className={authInputClassName}
                required
                hasError={!!errors.firstName}
                aria-describedby={
                  errors.firstName ? "firstName-error" : undefined
                }
              />
              {errors.firstName && (
                <p
                  id="firstName-error"
                  className="text-sm text-rose-600"
                  role="alert"
                >
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="lastName"
                className={authTheme.label}
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
                className={authInputClassName}
                required
                hasError={!!errors.lastName}
                aria-describedby={
                  errors.lastName ? "lastName-error" : undefined
                }
              />
              {errors.lastName && (
                <p
                  id="lastName-error"
                  className="text-sm text-rose-600"
                  role="alert"
                >
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="email"
              className={authTheme.label}
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
              className={authInputClassName}
              required
              hasError={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-rose-600" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="flex justify-end mt-4">
            <Button
              onClick={() => void handleNext()}
              disabled={!canProceed()}
              className="px-8 flex items-center gap-2 transition-transform hover:translate-x-1"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step Content - Credentials */}
      {currentStep === "credentials" && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#13211E]">Set Your Password</h1>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className={authTheme.label}
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
                className={`${authInputClassName} ${authTheme.inputWithTrailingIcon}`}
                required
                hasError={!!errors.password}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${authTheme.inputIconInteractive} hover:text-[#13211E]`}
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
              <p
                id="password-error"
                className="text-sm text-rose-600"
                role="alert"
              >
                {errors.password.message}
              </p>
            )}
            <p className={authTheme.helperText}>
              Must be 8+ characters with uppercase, lowercase, number, and
              special character
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className={authTheme.label}
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
                className={`${authInputClassName} ${authTheme.inputWithTrailingIcon}`}
                required
                hasError={!!errors.confirmPassword}
                aria-describedby={
                  errors.confirmPassword ? "confirmPassword-error" : undefined
                }
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${authTheme.inputIconInteractive} hover:text-[#13211E]`}
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
                className="text-sm text-rose-600"
                role="alert"
              >
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="flex justify-end mt-4">
            <Button
              onClick={() => void handleNext()}
              disabled={!canProceed()}
              isLoading={isLoading}
              className="px-8 flex items-center gap-2 transition-transform hover:translate-x-1"
            >
              {isLoading ? "Creating Account..." : "Create My Account"}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>

          <p className="text-center text-xs text-[#5F746E]">
            By submitting this form, I agree to the{" "}
            <a href="#" className={authTheme.link}>
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
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-teal-500">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-[#13211E]">
              Account Creation Complete
            </h1>
            <p className="text-[#5F746E]">
              Click the button to proceed to the login page.
            </p>
          </div>

          <div className="flex justify-center">
            <Button onClick={onSuccess}>Proceed to Login</Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function RegisterPage() {
  const navigate = useNavigate()

  const handleBackToLogin = () => {
    navigate("/login")
  }

  const handleRegisterSuccess = () => {
    navigate("/login")
  }
  return (
    <div className={authTheme.pageShell}>
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={authTheme.backgroundOrbPrimary}></div>
        <div className={authTheme.backgroundOrbSecondary}></div>
      </div>

      {/* Registration Card */}
      <div className={`${authTheme.cardWrapper} ${authTheme.registerCardWidth}`}>
        <div className={authTheme.cardSurface}>
          <RegisterForm
            onBackToLogin={handleBackToLogin}
            onSuccess={handleRegisterSuccess}
          />
        </div>
      </div>
    </div>
  )
}

