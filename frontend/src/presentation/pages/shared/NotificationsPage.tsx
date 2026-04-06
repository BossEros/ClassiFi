import { useState, useEffect, useCallback } from "react";
import { Bell, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout";
import { Button } from "@/presentation/components/ui/Button";
import * as notificationService from "@/business/services/notificationService";
import type { Notification } from "@/data/api/notification.types";
import { useToastStore } from "@/shared/store/useToastStore";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar";
import * as Icons from "lucide-react";
import { Trash2 } from "lucide-react";
import { dashboardTheme } from "@/presentation/constants/dashboardTheme";

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
      className={`relative overflow-hidden p-4 rounded-lg border transition-all cursor-pointer ${
        !notification.isRead
          ? "bg-teal-50 border-teal-300 shadow-[0_6px_16px_rgba(13,148,136,0.14)] hover:bg-teal-100 hover:shadow-[0_10px_20px_rgba(13,148,136,0.18)]"
          : "bg-slate-50 border-slate-300 shadow-sm hover:bg-white hover:shadow-md"
      }`}
    >
      {!notification.isRead && (
        <span
          className="absolute left-0 top-0 h-full w-1.5 bg-teal-600"
          aria-hidden="true"
        />
      )}

      <div className="flex items-start gap-4">
        <div
          className={`p-3 rounded-full shrink-0 ${
            !notification.isRead
              ? "bg-teal-100 text-teal-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          <Icon className="w-6 h-6" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`text-base font-semibold ${
                !notification.isRead ? "text-slate-900" : "text-slate-700"
              }`}
            >
              {notification.title}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(notification.id)
              }}
              className="text-slate-400 hover:text-rose-600 transition-colors shrink-0"
              aria-label="Delete notification"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <p
            className={`text-sm mt-1 ${!notification.isRead ? "text-slate-700" : "text-slate-500"}`}
          >
            {notification.message}
          </p>

          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs text-slate-500">{timeAgo}</span>
            {!notification.isRead && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleClick()
                }}
                className="text-xs text-teal-700 hover:text-teal-800 font-medium transition-colors"
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

function NotificationSkeletonCard() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-full bg-slate-200 shrink-0" />
        <div className="flex-1 space-y-2.5">
          <div className="h-4 w-2/3 rounded bg-slate-200" />
          <div className="h-3 w-full rounded bg-slate-100" />
          <div className="h-3 w-5/6 rounded bg-slate-100" />
          <div className="h-3 w-24 rounded bg-slate-100" />
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
  const [loadError, setLoadError] = useState<string | null>(null)

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
      setLoadError(null)

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
    } catch {
      setLoadError("Failed to load notifications.")
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
    } catch {
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
    } catch {
      showToast("Failed to mark all as read", "error")
    }
  }

  const handleDelete = async (notificationId: number) => {
    try {
      await notificationService.deleteNotification(notificationId)
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      setTotal((prev) => prev - 1)
      showToast("Notification deleted")
    } catch {
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
              <h1 className={dashboardTheme.pageTitle}>Notifications</h1>
              <p className={dashboardTheme.pageSubtitle}>
                Stay updated with your latest activities
              </p>
            </div>
          </div>
          {notifications.length > 0 && (
            <Button
              onClick={handleMarkAllAsRead}
              className="w-full md:w-auto px-6 bg-teal-600 hover:bg-teal-500 text-white border border-teal-600 rounded-md"
              disabled={loading}
            >
              Mark all as read
            </Button>
          )}
        </div>

        <div className={`${dashboardTheme.divider} mb-8`}></div>
      </div>

      {/* Notifications List */}
      {loadError && page === 1 ? (
        <div className={dashboardTheme.errorSurface}>
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">{loadError}</p>
            <p className="text-xs text-rose-600 mt-1">
              Please try again to refresh your notifications.
            </p>
          </div>
          <Button
            onClick={() => {
              setPage(1)
              loadNotifications()
            }}
            className="h-9 px-4 bg-white text-rose-700 border border-rose-300 hover:bg-rose-50 rounded-md"
          >
            Retry
          </Button>
        </div>
      ) : loading && page === 1 ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <NotificationSkeletonCard key={index} />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className={dashboardTheme.emptySurface}>
          <div className={dashboardTheme.emptyIconSurface}>
            <Bell className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            No notifications yet
          </h3>
          <p className="text-slate-500 mx-auto leading-relaxed">
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
                className="w-full md:w-auto px-8 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}

          {loadingMore && (
            <div className="mt-3 space-y-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <NotificationSkeletonCard key={`more-${index}`} />
              ))}
            </div>
          )}

          {notifications.length > 0 && total > 0 && (
            <div className="mt-4 text-center text-sm text-slate-500">
              Showing {notifications.length} of {total} notification
              {total !== 1 ? "s" : ""}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  )
}

