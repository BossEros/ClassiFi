import { useEffect, useState } from "react"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/presentation/components/ui/Button"

interface EmailConfirmationPageProps {
  onRedirectToLogin?: () => void
}

export function EmailConfirmationPage({
  onRedirectToLogin,
}: EmailConfirmationPageProps) {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  )
  const [message, setMessage] = useState("")

  useEffect(() => {
    // Check for token in URL query params or hash (from email confirmation link)
    const handleEmailConfirmation = () => {
      // First check query parameters
      const searchParams = new URLSearchParams(window.location.search)
      let tokenHash = searchParams.get("token_hash")
      let tokenType = searchParams.get("type")
      let error = searchParams.get("error")
      let errorDescription = searchParams.get("error_description")

      // Fallback to hash parameters if query params not found
      if (!tokenHash) {
        const hash = window.location.hash
        const hashParams = new URLSearchParams(hash.substring(1))
        tokenHash =
          hashParams.get("access_token") || hashParams.get("token_hash")
        tokenType = hashParams.get("type")
        error = hashParams.get("error")
        errorDescription = hashParams.get("error_description")
      }

      if (error) {
        // Handle error
        setStatus("error")
        setMessage(
          errorDescription ||
            "Failed to confirm email. The link may have expired.",
        )
        return
      }

      if (tokenHash && (tokenType === "signup" || tokenType === "email")) {
        // Email confirmed successfully
        setStatus("success")
        setMessage("Your email has been confirmed successfully!")

        // Clear the hash from URL
        window.history.replaceState(null, "", window.location.pathname)

        // Auto-redirect to login after 3 seconds
        setTimeout(() => {
          onRedirectToLogin?.()
        }, 3000)
      } else if (tokenHash && tokenType === "recovery") {
        // Password recovery
        setStatus("success")
        setMessage("Email verified. You can now reset your password.")
      } else {
        // No confirmation token found
        setStatus("error")
        setMessage(
          "No confirmation data found. Please click the link in your email.",
        )
      }
    }

    handleEmailConfirmation()
  }, [onRedirectToLogin])

  const handleRedirect = () => {
    onRedirectToLogin?.()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {status === "loading" && (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>
            )}
            {status === "success" && (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            )}
            {status === "error" && (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-white" />
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-white text-center mb-4">
            {status === "loading" && "Confirming Email..."}
            {status === "success" && "Email Confirmed!"}
            {status === "error" && "Confirmation Failed"}
          </h1>

          {/* Message */}
          <p className="text-gray-300 text-center mb-6">
            {status === "loading" &&
              "Please wait while we confirm your email address..."}
            {message}
          </p>

          {/* Actions */}
          {status === "success" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-400 text-center">
                Redirecting to login in 3 seconds...
              </p>
              <Button onClick={handleRedirect} className="w-full">
                Go to Login Now
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-3">
              <Button onClick={handleRedirect} className="w-full">
                Back to Login
              </Button>
              <p className="text-sm text-gray-400 text-center">
                Need help? Contact support
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
