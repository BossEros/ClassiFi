import { useState, useEffect } from "react"
import { Toggle } from "@/presentation/components/ui/Toggle"
import { notificationPreferenceService } from "@/business/services/notificationPreferenceService"
import type {
  NotificationPreference,
  NotificationType,
} from "@/business/models/notification/preference.types"
import { Mail, Bell } from "lucide-react"

/**
 * Notification preferences component.
 * Allows users to configure email and in-app notification settings.
 */
export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      setLoading(true)
      const prefs = await notificationPreferenceService.getPreferences()
      setPreferences(prefs)
    } catch (error) {
      console.error("Failed to load notification preferences:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (
    type: NotificationType,
    field: "emailEnabled" | "inAppEnabled",
    currentValue: boolean,
  ) => {
    const updateKey = `${type}-${field}`
    setUpdating(updateKey)

    try {
      const preference = preferences.find((p) => p.notificationType === type)

      if (!preference) return

      const updatedPreference =
        await notificationPreferenceService.updatePreference(
          type,
          field === "emailEnabled" ? !currentValue : preference.emailEnabled,
          field === "inAppEnabled" ? !currentValue : preference.inAppEnabled,
        )

      setPreferences((prev) =>
        prev.map((p) => (p.notificationType === type ? updatedPreference : p)),
      )
    } catch (error) {
      console.error("Failed to update notification preference:", error)
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 rounded-lg bg-white/5 border border-white/5 animate-pulse"
          >
            <div className="h-4 bg-white/10 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-white/10 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {preferences.map((preference) => {
        const label = notificationPreferenceService.getNotificationTypeLabel(
          preference.notificationType,
        )
        const description =
          notificationPreferenceService.getNotificationTypeDescription(
            preference.notificationType,
          )

        return (
          <div
            key={preference.notificationType}
            className="p-4 rounded-lg bg-white/5 border border-white/5"
          >
            <div className="mb-3">
              <h4 className="text-sm font-medium text-white">{label}</h4>
              <p className="text-xs text-slate-400 mt-1">{description}</p>
            </div>

            <div className="space-y-3">
              {/* Email Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">Email</span>
                </div>
                <Toggle
                  enabled={preference.emailEnabled}
                  onChange={() =>
                    handleToggle(
                      preference.notificationType,
                      "emailEnabled",
                      preference.emailEnabled,
                    )
                  }
                  disabled={
                    updating === `${preference.notificationType}-emailEnabled`
                  }
                />
              </div>

              {/* In-App Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">In-App</span>
                </div>
                <Toggle
                  enabled={preference.inAppEnabled}
                  onChange={() =>
                    handleToggle(
                      preference.notificationType,
                      "inAppEnabled",
                      preference.inAppEnabled,
                    )
                  }
                  disabled={
                    updating === `${preference.notificationType}-inAppEnabled`
                  }
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
