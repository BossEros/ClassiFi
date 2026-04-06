export interface UploadAvatarRequest {
  file: File
  currentAvatarUrl?: string
}

export interface UploadAvatarResponse {
  success: boolean
  avatarUrl?: string
  message?: string
}
