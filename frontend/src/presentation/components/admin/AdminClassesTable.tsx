import {
  Archive,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreVertical,
  Search,
  Trash2,
  User,
  Users,
} from "lucide-react"
import type { MouseEvent } from "react"
import type { AdminClass } from "@/business/services/adminService"

interface DropdownPosition {
  id: number
  x: number
  y: number
}

interface AdminClassesTableProps {
  classes: AdminClass[]
  isLoading: boolean
  page: number
  totalPages: number
  activeDropdown: DropdownPosition | null
  actionLoading: number | null
  onRowClick: (classId: number) => void
  onDropdownClick: (event: MouseEvent, classId: number) => void
  onPreviousPage: () => void
  onNextPage: () => void
  onEditClass: (selectedClass: AdminClass) => void
  onArchiveClass: (classId: number) => void
  onRequestDeleteClass: (selectedClass: AdminClass) => void
  onCloseDropdown: () => void
}

function getStatusBadgeStyle(isActive: boolean): string {
  return isActive
    ? "bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]"
    : "bg-gray-500/10 text-gray-400 border-gray-500/20"
}

function getOrdinalSuffix(value: number): string {
  if (value === 1) {
    return "st"
  }

  if (value === 2) {
    return "nd"
  }

  if (value === 3) {
    return "rd"
  }

  return "th"
}

export function AdminClassesTable({
  classes,
  isLoading,
  page,
  totalPages,
  activeDropdown,
  actionLoading,
  onRowClick,
  onDropdownClick,
  onPreviousPage,
  onNextPage,
  onEditClass,
  onArchiveClass,
  onRequestDeleteClass,
  onCloseDropdown,
}: AdminClassesTableProps) {
  const activeClass = activeDropdown
    ? (classes.find((item) => item.id === activeDropdown.id) ?? null)
    : null

  return (
    <div className="relative rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50" />

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="px-6 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[35%]">
                Class Details
              </th>
              <th className="px-6 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[20%]">
                Teacher
              </th>
              <th className="px-6 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[20%]">
                Academic Info
              </th>
              <th className="px-6 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[10%]">
                Students
              </th>
              <th className="px-6 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[10%]">
                Status
              </th>
              <th className="px-6 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right w-[5%]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              [...Array(5)].map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-6 py-5">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-white/5 rounded" />
                      <div className="h-3 w-48 bg-white/5 rounded" />
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="h-4 w-24 bg-white/5 rounded" />
                  </td>
                  <td className="px-6 py-5">
                    <div className="h-4 w-32 bg-white/5 rounded" />
                  </td>
                  <td className="px-6 py-5">
                    <div className="h-4 w-12 bg-white/5 rounded" />
                  </td>
                  <td className="px-6 py-5">
                    <div className="h-6 w-16 bg-white/5 rounded-full" />
                  </td>
                  <td className="px-6 py-5">
                    <div className="h-8 w-8 ml-auto bg-white/5 rounded" />
                  </td>
                </tr>
              ))
            ) : classes.length > 0 ? (
              classes.map((selectedClass) => (
                <tr
                  key={selectedClass.id}
                  onClick={() => onRowClick(selectedClass.id)}
                  className="group hover:bg-white/[0.02] transition-colors duration-200 cursor-pointer"
                >
                  <td className="px-6 py-5">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                          {selectedClass.className}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/5 text-gray-400 shrink-0">
                        <User className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-300 font-medium">
                          {selectedClass.teacherName}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-medium text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/10">
                          {selectedClass.yearLevel}
                          {getOrdinalSuffix(selectedClass.yearLevel)} Year
                        </span>
                        <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10">
                          {selectedClass.semester}
                          {getOrdinalSuffix(selectedClass.semester)} Sem
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 pl-1">
                        A.Y. {selectedClass.academicYear}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                      <span className="text-sm text-gray-300 font-medium">
                        {selectedClass.studentCount}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeStyle(selectedClass.isActive)}`}
                    >
                      {selectedClass.isActive ? "Active" : "Archived"}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={(event) =>
                          onDropdownClick(event, selectedClass.id)
                        }
                        disabled={actionLoading === selectedClass.id}
                        className={`p-2 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors ${
                          activeDropdown?.id === selectedClass.id
                            ? "bg-white/10 text-white ring-1 ring-white/10"
                            : ""
                        }`}
                      >
                        {actionLoading === selectedClass.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <MoreVertical className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-16 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 rounded-full bg-white/5">
                      <Search className="w-8 h-8 opacity-40" />
                    </div>
                    <p className="text-lg font-medium text-gray-400">
                      No classes found
                    </p>
                    <p className="text-sm">
                      Try adjusting your search or filters
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/[0.01]">
          <p className="text-sm text-gray-500">
            Page <span className="font-medium text-white">{page}</span> of{" "}
            <span className="font-medium text-white">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={onPreviousPage}
              disabled={page === 1}
              className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onNextPage}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {activeDropdown && activeClass && (
        <div
          className="fixed w-56 bg-[#0B1120] backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/5"
          style={{
            left: activeDropdown.x,
            top: activeDropdown.y,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="p-1.5 space-y-1">
            <button
              onClick={() => {
                onEditClass(activeClass)
                onCloseDropdown()
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white rounded-lg transition-all"
            >
              <BookOpen className="w-4 h-4 text-blue-400" />
              Edit Class
            </button>

            {activeClass.isActive && (
              <button
                onClick={() => onArchiveClass(activeClass.id)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white rounded-lg transition-all"
              >
                <Archive className="w-4 h-4 text-yellow-500" />
                Archive Class
              </button>
            )}

            <div className="h-[1px] bg-white/5 mx-2" />

            <button
              onClick={() => {
                onRequestDeleteClass(activeClass)
                onCloseDropdown()
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-all group/delete"
            >
              <Trash2 className="w-4 h-4 group-hover/delete:animate-bounce" />
              Delete Class
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
