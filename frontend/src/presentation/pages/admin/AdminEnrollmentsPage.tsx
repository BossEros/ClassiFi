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
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 shadow-sm shadow-sky-100/70">
              <GraduationCap className="h-7 w-7 text-sky-600 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                Enrollment Management
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Manage student enrollments across classes.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-300 bg-white p-12 text-center shadow-md shadow-slate-200/80">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-amber-200 bg-amber-50 shadow-sm shadow-amber-100/70">
            <Construction className="h-10 w-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Coming Soon
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
            This page is still temporary. Enrollment management features will be
            available in a future update.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <div className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
              Bulk enrollment
            </div>
            <div className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
              Transfer students
            </div>
            <div className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
              Enrollment history
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-4 text-center text-sm text-slate-500">
          Tip: You can manage enrollments for individual classes from the Class
          Detail page.
        </div>
      </div>
    </DashboardLayout>
  )
}
