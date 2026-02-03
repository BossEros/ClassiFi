import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import * as notificationService from "@/business/services/notificationService"
import type { Notification } from "@/business/models/notification/types"
import { NotificationItem } from "./NotificationItem"

interface NotificationDropdownProps {
  onClose: () => void
  onMarkAllRead: () => void
  onNotificationRead: () => void
}

/**
 * Dropdown component that displays recent notifications.
 * Shows the last 5 notifications with a link to view all.
 */
export function NotificationDropdown({
  onClose,
  onMarkAllRead,
  onNotificationRead,
}: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadNotifications()

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  const loadNotifications = async () => {
    try {
      const response = await notificationService.getNotifications(1, 5)
      setNotifications(response.notifications)
    } catch (error) {
      console.error("Failed to load notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId)
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n,
        ),
      )
      onNotificationRead()
    } catch (error) {
      console.error("Failed to mark as read:", error)
    }
  }

  const handleMarkAllReadClick = async () => {
    try {
      await onMarkAllRead()

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString(),
        })),
      )
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
    }
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-96 bg-slate-800 rounded-lg shadow-xl border border-white/10 z-50"
    >
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Notifications</h3>
        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllReadClick}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-slate-400">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              onClick={onClose}
            />
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-3 border-t border-white/10 text-center">
          <Link
            to="/dashboard/notifications"
            className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
            onClick={onClose}
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  )
}
