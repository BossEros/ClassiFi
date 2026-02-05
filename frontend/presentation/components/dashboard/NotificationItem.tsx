import { useNavigate } from "react-router-dom"
import * as notificationService from "@/business/services/notificationService"
import type { Notification } from "@/business/models/notification/types"
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

  const getNavigationUrl = (): string | null => {
    switch (notification.type) {
      case "ASSIGNMENT_CREATED":
        return `/dashboard/assignments/${notification.metadata.assignmentId}`
      case "SUBMISSION_GRADED":
        return `/dashboard/assignments/${notification.metadata.assignmentId}`
      case "CLASS_ANNOUNCEMENT":
        return `/dashboard/classes/${notification.metadata.classId}`
      case "DEADLINE_REMINDER":
        return `/dashboard/assignments/${notification.metadata.assignmentId}`
      case "ENROLLMENT_CONFIRMED":
        return `/dashboard/classes/${notification.metadata.classId}`
      default:
        return null
    }
  }

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id)
    }

    const url = getNavigationUrl()
    if (url) {
      navigate(url)
    }

    onClick()
  }

  return (
    <div
      className={`p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${!notification.isRead ? "bg-blue-500/10" : ""
        }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div
          className={`p-2 rounded-full shrink-0 ${!notification.isRead
              ? "bg-blue-500/20 text-blue-400"
              : "bg-slate-700 text-slate-400"
            }`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium ${!notification.isRead ? "text-white" : "text-slate-300"
              }`}
          >
            {notification.title}
          </p>
          <p className="text-sm text-slate-400 mt-1 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-slate-500 mt-1">{timeAgo}</p>
        </div>
        {!notification.isRead && (
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
        )}
      </div>
    </div>
  )
}
