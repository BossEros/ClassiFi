import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import * as notificationService from "@/business/services/notificationService"
import { NotificationDropdown } from "./NotificationDropdown"

/**
 * Notification badge component that displays unread count and dropdown.
 * Polls for unread count every 30 seconds.
 */
export function NotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUnreadCount()

    // Poll for updates every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000)

    return () => clearInterval(interval)
  }, [])

  const loadUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount()
      setUnreadCount(count)
    } catch (error) {
      console.error("Failed to load unread count:", error)
      // Set to 0 on error to prevent UI issues
      setUnreadCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setUnreadCount(0)
    } catch (error) {
      console.error("Failed to mark all as read:", error)
    }
  }

  const handleNotificationRead = () => {
    // Decrement count when a notification is marked as read
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const displayCount = unreadCount > 99 ? "99+" : unreadCount.toString()

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Notifications"
        disabled={isLoading}
      >
        <Bell className="w-5 h-5 text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[20px]">
            {displayCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          onClose={() => setIsOpen(false)}
          onMarkAllRead={handleMarkAllRead}
          onNotificationRead={handleNotificationRead}
        />
      )}
    </div>
  )
}
