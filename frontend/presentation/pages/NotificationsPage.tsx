import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { DashboardLayout } from "@/presentation/components/dashboard/DashboardLayout"
import { Card, CardContent } from "@/presentation/components/ui/Card"
import { Button } from "@/presentation/components/ui/Button"
import * as notificationService from "@/business/services/notificationService"
import type { Notification } from "@/business/models/notification/types"
import { NotificationCard } from "@/presentation/components/notifications/NotificationCard"
import { useToast } from "@/shared/context/ToastContext"
import { getCurrentUser } from "@/business/services/authService"
import { useTopBar } from "@/presentation/components/dashboard/TopBar"
import type { User } from "@/business/models/auth/types"

/**
 * Notifications page component.
 * Displays all notifications with pagination and mark all as read functionality.
 */
export function NotificationsPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      navigate("/login")
      return
    }
    setUser(currentUser)
  }, [navigate])

  const userInitials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = useTopBar({ user, userInitials })

  useEffect(() => {
    loadNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const loadNotifications = async () => {
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

      setHasMore(response.pagination.hasMore)
      setTotal(response.pagination.total)
    } catch (error) {
      console.error("Failed to load notifications:", error)
      showToast("Failed to load notifications", "error")
    } finally {
      setLoading(false)
      setLoadingMore(false)
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
              className="w-full md:w-auto px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
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
                  Showing {notifications.length} of {total} notification{total !== 1 ? 's' : ''}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
