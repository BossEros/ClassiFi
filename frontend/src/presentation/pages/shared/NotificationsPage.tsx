import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout";
import { Card, CardContent } from "@/presentation/components/ui/Card";
import { Button } from "@/presentation/components/ui/Button";
import * as notificationService from "@/business/services/notificationService";
import type { Notification } from "@/business/models/notification/types";
import { useToastStore } from "@/shared/store/useToastStore";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar";
import * as Icons from "lucide-react";
import { Trash2 } from "lucide-react";

// Inlined from src/presentation/components/shared/notifications/NotificationCard.tsx
interface NotificationCardProps {
  notification: Notification
  onMarkAsRead: (id: number) => void
  onDelete: (id: number) => void
}



/**
 * Full notification card component for the notifications page.
 * Clicking navigates to the relevant content based on notification type.
 *
 * @param props - The component props of type NotificationCardProps.
 * @param props.notification - The Notification object to display.
 * @param props.onMarkAsRead - Callback invoked to mark the notification as read.
 * @param props.onDelete - Callback invoked to delete the notification.
 * @returns The rendered notification card as a JSX.Element.
 */
function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationCardProps) {
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
  }

  return (
    <div
      onClick={handleClick}
      className={`p-4 rounded-lg border transition-colors cursor-pointer ${
        !notification.isRead
          ? "bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/15"
          : "bg-slate-800 border-white/10 hover:bg-slate-700"
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

/**
 * Notifications page component.
 * Displays all notifications with pagination and mark all as read functionality.
 */
export function NotificationsPage() {
  const navigate = useNavigate()
  const showToast = useToastStore((state) => state.showToast)
  const user = useAuthStore((state) => state.user)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate("/login")
      return
    }
  }, [navigate, user])

  const userInitials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = useTopBar({ user, userInitials })

  const loadNotifications = useCallback(async () => {
    try {
      if (page === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      const response = await notificationService.getNotifications(page, 10)

      if (page === 1) {
        setNotifications(response.notifications)
      } else {
        setNotifications((prev) => [...prev, ...response.notifications])
      }

      setHasMore(response.hasMore)
      setTotal(response.total)
    } catch (error) {
      console.error("Failed to load notifications:", error)
      showToast("Failed to load notifications", "error")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [page, showToast])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

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
    } catch (error) {
      console.error("Failed to mark as read:", error)
      showToast("Failed to mark notification as read", "error")
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString(),
        })),
      )
      showToast("All notifications marked as read")
    } catch (error) {
      console.error("Failed to mark all as read:", error)
      showToast("Failed to mark all as read", "error")
    }
  }

  const handleDelete = async (notificationId: number) => {
    try {
      await notificationService.deleteNotification(notificationId)
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      setTotal((prev) => prev - 1)
      showToast("Notification deleted")
    } catch (error) {
      console.error("Failed to delete notification:", error)
      showToast("Failed to delete notification", "error")
    }
  }

  const handleLoadMore = () => {
    setPage((p) => p + 1)
  }

  return (
    <DashboardLayout topBar={topBar}>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                Notifications
              </h1>
              <p className="text-slate-300 text-sm mt-1">
                Stay updated with your latest activities
              </p>
            </div>
          </div>
          {notifications.length > 0 && (
            <Button
              onClick={handleMarkAllAsRead}
              className="w-full md:w-auto px-6 bg-blue-600 hover:bg-blue-700 text-white border border-blue-500/40"
              disabled={loading}
            >
              Mark all as read
            </Button>
          )}
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8"></div>
      </div>

      {/* Notifications List */}
      <Card className="border-none bg-transparent shadow-none backdrop-blur-none p-0">
        <CardContent className="p-0">
          {loading && page === 1 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-slate-300 animate-pulse">
                Loading notifications...
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="w-full py-20 px-6 text-center bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <Bell className="w-10 h-10 text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No notifications yet
              </h3>
              <p className="text-slate-300 mx-auto leading-relaxed">
                When you receive notifications, they'll appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {notifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="mt-6 text-center">
                  <Button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="w-full md:w-auto px-8 bg-slate-700 hover:bg-slate-600 text-white"
                  >
                    {loadingMore ? "Loading..." : "Load more"}
                  </Button>
                </div>
              )}

              {notifications.length > 0 && total > 0 && (
                <div className="mt-4 text-center text-sm text-slate-400">
                  Showing {notifications.length} of {total} notification
                  {total !== 1 ? "s" : ""}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
