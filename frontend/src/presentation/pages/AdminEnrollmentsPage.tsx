import { GraduationCap, Construction } from "lucide-react"

export default function AdminEnrollmentsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
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

        {/* Under Construction Card */}
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

        {/* Tip */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Tip: You can manage enrollments for individual classes from the Class
          Detail page.
        </p>
      </div>
    </div>
  )
}
