import { Calendar as CalendarIcon } from "lucide-react"
import { DashboardLayout } from "@/presentation/components/dashboard/DashboardLayout"
import { Card, CardContent } from "@/presentation/components/ui/Card"
import { getCurrentUser } from "@/business/services/authService"
import { useTopBar } from "@/presentation/components/dashboard/TopBar"

/**
 * Temporary Calendar page component.
 * Placeholder page for future calendar functionality.
 */
export function CalendarPage() {
  const user = getCurrentUser()!

  const userInitials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()

  const topBar = useTopBar({ user, userInitials })

  return (
    <DashboardLayout topBar={topBar}>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
              Calendar
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              View your schedule and upcoming deadlines
            </p>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8"></div>
      </div>

      {/* Calendar Content */}
      <Card className="border-none bg-transparent shadow-none backdrop-blur-none p-0">
        <CardContent className="p-0">
          <div className="w-full py-20 px-6 text-center bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
              <CalendarIcon className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Calendar Coming Soon
            </h3>
            <p
              className="text-slate-300 mx-auto leading-relaxed"
              style={{
                maxWidth: "600px",
                wordWrap: "break-word",
                whiteSpace: "normal",
              }}
            >
              We're working on bringing you a comprehensive calendar view to
              help you stay organized with all your assignments and deadlines.
            </p>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
