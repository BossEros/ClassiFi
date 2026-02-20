import type { NotificationType } from "./types"

export type { NotificationType }

export interface NotificationPreference {
  id: number
  userId: number
  notificationType: NotificationType
  emailEnabled: boolean
  inAppEnabled: boolean
  createdAt: string
  updatedAt: string | null
}

export interface UpdateNotificationPreferenceRequest {
  notificationType: NotificationType
  emailEnabled: boolean
  inAppEnabled: boolean
}
