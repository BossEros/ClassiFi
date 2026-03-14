import { useState } from "react"
import { Plus, RefreshCw } from "lucide-react"
import { cn } from "@/shared/utils/cn"

interface CreateModuleInputProps {
  onCreateModule: (name: string) => Promise<void>
  variant?: "dark" | "light"
}

/**
 * Inline input for creating a new module within a class.
 *
 * @param onCreateModule - Async callback to create a module with the given name.
 * @param variant - Visual variant for light/dark backgrounds.
 */
export function CreateModuleInput({ onCreateModule, variant = "light" }: CreateModuleInputProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [moduleName, setModuleName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isLight = variant === "light"

  const handleSubmit = async () => {
    const trimmedName = moduleName.trim()

    if (!trimmedName) {
      setError("Module name is required")
      return
    }

    if (trimmedName.length > 255) {
      setError("Module name must not exceed 255 characters")
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await onCreateModule(trimmedName)
      setModuleName("")
      setIsCreating(false)
    } catch {
      setError("Failed to create module. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      handleSubmit()
    }

    if (event.key === "Escape") {
      setIsCreating(false)
      setModuleName("")
      setError(null)
    }
  }

  const handleCancel = () => {
    setIsCreating(false)
    setModuleName("")
    setError(null)
  }

  if (!isCreating) {
    return (
      <button
        onClick={() => setIsCreating(true)}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
          isLight
            ? "border-2 border-dashed border-teal-300 text-teal-700 bg-teal-50/60 hover:border-teal-400 hover:bg-teal-50"
            : "border-2 border-dashed border-teal-500/30 text-teal-400 bg-teal-500/5 hover:border-teal-400 hover:bg-teal-500/10",
        )}
      >
        <Plus className="h-4 w-4" />
        Create Module
      </button>
    )
  }

  return (
    <div
      className={cn(
        "rounded-xl border p-4 space-y-3",
        isLight ? "border-slate-200 bg-white shadow-sm" : "border-white/10 bg-white/5",
      )}
    >
      <input
        type="text"
        value={moduleName}
        onChange={(event) => {
          setModuleName(event.target.value)
          setError(null)
        }}
        onKeyDown={handleKeyDown}
        placeholder="Enter module name..."
        autoFocus
        disabled={isSubmitting}
        maxLength={255}
        className={cn(
          "w-full rounded-lg border px-3 py-2 text-sm transition-colors duration-200",
          "focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isLight
            ? "border-slate-300 bg-white text-slate-900 placeholder-slate-400"
            : "border-white/20 bg-white/5 text-white placeholder-slate-500",
          error && "border-rose-400 focus:ring-rose-500 focus:border-rose-500",
        )}
      />

      {error && <p className="text-xs text-rose-500">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !moduleName.trim()}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200",
            "bg-teal-600 text-white hover:bg-teal-700",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {isSubmitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          {isSubmitting ? "Creating..." : "Create"}
        </button>
        <button
          onClick={handleCancel}
          disabled={isSubmitting}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            isLight
              ? "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              : "text-slate-400 hover:text-white hover:bg-white/5",
          )}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
