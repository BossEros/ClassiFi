import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Construction, GraduationCap } from "lucide-react"
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar"

export default function AdminEnrollmentsPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.user)

  useEffect(() => {
    if (!currentUser) {
      navigate("/login")
      return
    }

    if (currentUser.role !== "admin") {
      navigate("/dashboard")
    }
  }, [currentUser, navigate])

  const userInitials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = useTopBar({ user: currentUser, userInitials })

  return (
    <DashboardLayout topBar={topBar}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30">
            <GraduationCap className="w-8 h-8 text-violet-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Enrollment Management
            </h1>
            <p className="text-slate-400">
              Manage student enrollments across classes
            </p>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-12 text-center">
          <div className="inline-flex p-4 rounded-full bg-amber-500/10 border border-amber-500/30 mb-6">
            <Construction className="w-12 h-12 text-amber-400" />
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">
            Coming Soon
          </h2>
          <p className="text-slate-400 max-w-md mx-auto">
            This page is under construction. Enrollment management features will
            be available in a future update.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <div className="px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50">
              <span className="text-sm text-slate-300">Bulk enrollment</span>
            </div>
            <div className="px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50">
              <span className="text-sm text-slate-300">Transfer students</span>
            </div>
            <div className="px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50">
              <span className="text-sm text-slate-300">Enrollment history</span>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          Tip: You can manage enrollments for individual classes from the Class
          Detail page.
        </p>
      </div>
    </DashboardLayout>
  )
}
