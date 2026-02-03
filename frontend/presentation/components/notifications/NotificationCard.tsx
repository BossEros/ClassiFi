import * as notificationService from "@/business/services/notificationService"
import type { Notification } from "@/business/models/notification/types"
import * as Icons from "lucide-react"
import { Trash2 } from "lucide-react"

interface NotificationCardProps {
  notification: Notification
  onMarkAsRead: (id: number) => void
  onDelete: (id: number) => void
}

/**
 * Full notification card component for the notifications page.
 *
 * @param props - The component props of type NotificationCardProps.
 * @param props.notification - The Notification object to display.
 * @param props.onMarkAsRead - Callback invoked to mark the notification as read.
 * @param props.onDelete - Callback invoked to delete the notification.
 * @returns The rendered notification card as a JSX.Element.
 */
export function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationCardProps) {
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
  }

  return (
    <div
      onClick={handleClick}
      className={`p-4 rounded-lg border transition-colors ${
        !notification.isRead
          ? "bg-blue-500/10 border-blue-500/30 cursor-pointer hover:bg-blue-500/15"
          : "bg-slate-800 border-white/10"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`p-3 rounded-full shrink-0 ${
            !notification.isRead
              ? "bg-blue-500/20 text-blue-400"
              : "bg-slate-700 text-slate-400"
          }`}
        >
          <Icon className="w-6 h-6" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`text-base font-semibold ${
                !notification.isRead ? "text-white" : "text-slate-300"
              }`}
            >
              {notification.title}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(notification.id)
              }}
              className="text-slate-400 hover:text-red-400 transition-colors shrink-0"
              aria-label="Delete notification"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-slate-400 mt-1">{notification.message}</p>

          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs text-slate-500">{timeAgo}</span>
            {!notification.isRead && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleClick()
                }}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Mark as read
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
