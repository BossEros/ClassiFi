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
import { supabase } from "@/data/api/supabaseClient"
import { getCurrentUser } from "@/business/services/authService"
import { apiClient } from "@/data/api/apiClient"

interface AvatarUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (avatarUrl: string) => void
  currentAvatarUrl?: string
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]

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

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return "Please select a valid image file (JPEG, PNG, GIF, or WebP)"
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 5MB"
    }
    return null
  }

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file)
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

    try {
      const user = getCurrentUser()
      if (!user) {
        setError("You must be logged in to upload an avatar")
        return
      }

      // Delete old avatar if exists
      if (currentAvatarUrl && currentAvatarUrl.includes("/avatars/")) {
        try {
          // Extract the file path from the URL
          const urlParts = currentAvatarUrl.split("/avatars/")
          if (urlParts.length > 1) {
            const oldFilePath = `avatars/${urlParts[1].split("?")[0]}` // Remove query params
            await supabase.storage
              .from("avatars")
              .remove([oldFilePath.replace("avatars/", "")])
          }
        } catch (deleteError) {
          console.error("Failed to delete old avatar:", deleteError)
          // Continue with upload anyway
        }
      }

      // Use consistent filename based on user ID (will overwrite existing)
      const fileExt = selectedFile.name.split(".").pop()
      const fileName = `${user.id}.${fileExt}`
      const filePath = `${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: true,
        })

      if (uploadError) {
        // Handle bucket not existing
        if (
          uploadError.message.includes("not found") ||
          uploadError.message.includes("bucket")
        ) {
          setError("Avatar storage is not configured. Please contact support.")
        } else {
          setError(uploadError.message || "Failed to upload image")
        }
        return
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath)

      // Persist avatar URL to backend database
      try {
        await apiClient.patch("/user/me/avatar", { avatarUrl: publicUrl })
      } catch (apiError) {
        console.error("Failed to persist avatar URL to backend:", apiError)
        // Continue anyway - file is uploaded, localStorage will still work
      }

      // Update user profile in localStorage
      const currentUser = getCurrentUser()
      if (currentUser) {
        const updatedUser = { ...currentUser, avatarUrl: publicUrl }
        localStorage.setItem("user", JSON.stringify(updatedUser))
        // Dispatch custom event to notify other components of the update
        window.dispatchEvent(new Event("userUpdated"))
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess?.(publicUrl)
        onClose()
      }, 1500)
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsUploading(false)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
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
                  accept={ACCEPTED_FILE_TYPES.join(",")}
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
                  "bg-gradient-to-r from-teal-600 to-teal-500 text-white",
                  "hover:from-teal-700 hover:to-teal-600",
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
