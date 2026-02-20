import * as React from "react"
import { cn } from "@/shared/utils/cn"
import {
  Camera,
  X,
  Upload,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
} from "lucide-react"
import { uploadAvatar } from "@/business/services/userService"
import {
  validateImageFile,
  FILE_VALIDATION,
} from "@/presentation/utils/imageValidation"

interface AvatarUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (avatarUrl: string) => void
  currentAvatarUrl?: string
}

export function AvatarUploadModal({
  isOpen,
  onClose,
  onSuccess,
  currentAvatarUrl,
}: AvatarUploadModalProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [preview, setPreview] = React.useState<string | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null)
      setPreview(null)
      setError(null)
      setSuccess(false)
      setIsDragging(false)
    }
  }, [isOpen])

  // Clean up preview URL on unmount
  React.useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview])

  // Close on escape key
  React.useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isUploading) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose, isUploading])

  const handleFileSelect = (file: File) => {
    const validationError = validateImageFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setSelectedFile(file)
    setError(null)

    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setError(null)

    const response = await uploadAvatar({
      file: selectedFile,
      currentAvatarUrl,
    })

    setIsUploading(false)

    if (response.success && response.avatarUrl) {
      setSuccess(true)
      setTimeout(() => {
        onSuccess?.(response.avatarUrl!)
        onClose()
      }, 1500)
    } else {
      setError(response.message || "Failed to upload avatar")
    }
  }

  const handleRemoveSelected = () => {
    if (preview) {
      URL.revokeObjectURL(preview)
    }
    setSelectedFile(null)
    setPreview(null)
    setError(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isUploading ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-[calc(100%-2rem)] min-w-[320px] max-w-[540px] mx-4 p-6 shrink-0",
          "rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-sm",
          "shadow-xl shadow-black/20",
          "animate-in fade-in-0 zoom-in-95 duration-200",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-upload-title"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isUploading}
          className={cn(
            "absolute top-4 right-4 p-1 rounded-lg",
            "text-gray-400 hover:text-white hover:bg-white/10",
            "transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center",
              success ? "bg-green-500/20" : "bg-teal-500/20",
            )}
          >
            {success ? (
              <CheckCircle className="w-8 h-8 text-green-400 shrink-0" />
            ) : (
              <Camera className="w-8 h-8 text-teal-400 shrink-0" />
            )}
          </div>
        </div>

        {/* Title */}
        <h2
          id="avatar-upload-title"
          className="text-xl font-semibold text-white text-center mb-2"
        >
          {success ? "Avatar Updated!" : "Change Profile Picture"}
        </h2>

        {/* Description */}
        <p className="text-gray-400 text-center mb-6 text-sm w-full">
          {success
            ? "Your profile picture has been updated."
            : "Upload a new profile picture. Max file size is 5MB."}
        </p>

        {!success && (
          <div className="space-y-4">
            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 w-full">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-400 flex-1">{error}</p>
              </div>
            )}

            {/* Preview or Drop Zone */}
            {preview ? (
              <div className="relative">
                <div className="aspect-square w-40 mx-auto rounded-full overflow-hidden border-2 border-teal-500/30">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={handleRemoveSelected}
                  className={cn(
                    "absolute top-0 right-1/2 translate-x-[4.5rem] p-1 rounded-full",
                    "bg-slate-800 border border-white/10 text-gray-400",
                    "hover:text-white hover:bg-slate-700",
                    "transition-colors duration-200",
                  )}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer w-full flex flex-col items-center",
                  "transition-all duration-200",
                  isDragging
                    ? "border-teal-500 bg-teal-500/10"
                    : "border-white/20 hover:border-teal-500/50 hover:bg-white/5",
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={FILE_VALIDATION.ACCEPTED_IMAGE_TYPES.join(",")}
                  onChange={handleInputChange}
                  className="hidden"
                />

                {currentAvatarUrl ? (
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-2 border-white/10">
                    <img
                      src={currentAvatarUrl}
                      alt="Current avatar"
                      className="w-full h-full object-cover opacity-50"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center border-2 border-white/10">
                    <ImageIcon className="w-8 h-8 text-gray-500" />
                  </div>
                )}

                <div className="flex flex-col items-center justify-center gap-2 mb-2 w-full">
                  <Upload className="w-5 h-5 text-teal-400 shrink-0" />
                  <span className="text-white font-medium block w-full">
                    {isDragging ? "Drop image here" : "Click or drag to upload"}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  JPEG, PNG, GIF, or WebP • Max 5MB
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={isUploading}
                className={cn(
                  "flex-1 px-4 py-3 rounded-xl text-sm font-semibold",
                  "border border-white/20 text-white",
                  "hover:bg-white/10 transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className={cn(
                  "flex-1 px-4 py-3 rounded-xl text-sm font-semibold",
                  "bg-teal-600 text-white border border-teal-500/40",
                  "hover:bg-teal-700",
                  "transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                {isUploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
