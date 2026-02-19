import { apiClient, type ApiResponse } from "@/data/api/apiClient"
import type {
  NotificationListResponse,
  UnreadCountResponse,
} from "@/business/models/notification/types"

/**
 * Repository for notification-related API operations.
 * Handles all HTTP communication with the notification endpoints.
 */
export class NotificationRepository {
  /**
   * Fetches notifications for the current user with pagination.
   *
   * @param page - Page number (1-indexed)
   * @param limit - Number of notifications per page
   * @returns Paginated list of notifications
   */
  async getNotifications(
    page: number = 1,
    limit: number = 20,
  ): Promise<ApiResponse<NotificationListResponse>> {
    return await apiClient.get<NotificationListResponse>(
      `/notifications?page=${page}&limit=${limit}`,
    )
  }

  /**
   * Gets the count of unread notifications for the current user.
   *
   * @returns Unread notification count
   */
  async getUnreadCount(): Promise<ApiResponse<UnreadCountResponse>> {
    return await apiClient.get<UnreadCountResponse>(
      "/notifications/unread-count",
    )
  }

  /**
   * Marks a specific notification as read.
   *
   * @param notificationId - The ID of the notification to mark as read
   * @returns Success response
   */
  async markAsRead(
    notificationId: number,
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return await apiClient.patch<{ success: boolean; message: string }>(
      `/notifications/${notificationId}/read`,
      {},
    )
  }

  /**
   * Marks all notifications as read for the current user.
   *
   * @returns Success response
   */
  async markAllAsRead(): Promise<
    ApiResponse<{ success: boolean; message: string }>
  > {
    return await apiClient.patch<{ success: boolean; message: string }>(
      "/notifications/read-all",
      {},
    )
  }

  /**
   * Deletes a specific notification.
   *
   * @param notificationId - The ID of the notification to delete
   * @returns Success response
   */
  async deleteNotification(
    notificationId: number,
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return await apiClient.delete<{ success: boolean; message: string }>(
      `/notifications/${notificationId}`,
    )
  }
}

// Export singleton instance
export const notificationRepository = new NotificationRepository()
