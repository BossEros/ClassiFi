import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import * as notificationService from "@/business/services/notificationService"
import type { Notification } from "@/data/api/notification.types"
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
  const [loadError, setLoadError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadNotifications()

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
      setLoadError(null)
      const response = await notificationService.getNotifications(1, 5)
      setNotifications(response.notifications)
    } catch {
      setLoadError("Failed to load notifications.")
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
    } catch {
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
    } catch {
    }
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-96 rounded-lg border border-slate-300 bg-white shadow-2xl z-[9999]"
    >
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllReadClick}
            className="text-sm text-teal-700 hover:text-teal-800 transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-3 space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-lg border border-slate-200 bg-white p-3 animate-pulse"
              >
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 rounded bg-slate-200" />
                    <div className="h-3 w-full rounded bg-slate-100" />
                    <div className="h-3 w-1/3 rounded bg-slate-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="p-4 text-center">
            <p className="text-sm text-rose-700 mb-3">{loadError}</p>
            <button
              onClick={() => {
                setLoading(true)
                loadNotifications()
              }}
              className="text-xs font-medium px-3 py-1.5 rounded-md border border-rose-300 text-rose-700 hover:bg-rose-50 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
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
        <div className="border-t border-slate-200 p-3 text-center">
          <Link
            to="/dashboard/notifications"
            className="text-sm font-medium text-teal-700 hover:text-teal-800 transition-colors"
            onClick={onClose}
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  )
}
