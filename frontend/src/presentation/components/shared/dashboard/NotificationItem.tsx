import { useNavigate } from "react-router-dom"
import * as notificationService from "@/business/services/notificationService"
import type { Notification } from "@/data/api/notification.types"
import * as Icons from "lucide-react"

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: number) => void
  onClick: () => void
}

/**
 * Individual notification item component for the dropdown.
 * Displays notification icon, title, message, and time.
 * Clicking navigates to the relevant content based on notification type.
 */
export function NotificationItem({
  notification,
  onMarkAsRead,
  onClick,
}: NotificationItemProps) {
  const navigate = useNavigate()
  const iconName = notificationService.getNotificationIcon(notification.type)
  const Icon =
    (Icons as unknown as Record<string, typeof Icons.Bell>)[iconName] ||
    Icons.Bell
  const timeAgo = notificationService.formatNotificationTime(
    notification.createdAt,
  )

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id)
    }

    const url = notificationService.getNotificationNavigationUrl(notification)
    if (url) {
      navigate(url)
    }

    onClick()
  }

  return (
    <div
      className={`relative cursor-pointer border-b border-slate-100 p-4 transition-colors hover:bg-slate-50 ${
        !notification.isRead ? "bg-teal-50/80" : "bg-white"
      }`}
      onClick={handleClick}
    >
      {!notification.isRead && (
        <span
          className="absolute left-0 top-0 h-full w-1 bg-teal-600"
          aria-hidden="true"
        />
      )}

      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 rounded-full p-2 ${
            !notification.isRead
              ? "bg-teal-100 text-teal-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium ${
              !notification.isRead ? "text-slate-900" : "text-slate-700"
            }`}
          >
            {notification.title}
          </p>
          <p
            className={`mt-1 line-clamp-2 text-sm ${
              !notification.isRead ? "text-slate-700" : "text-slate-500"
            }`}
          >
            {notification.message}
          </p>
          <p className="mt-1 text-xs text-slate-500">{timeAgo}</p>
        </div>
        {!notification.isRead && (
          <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-teal-600"></div>
        )}
      </div>
    </div>
  )
}

