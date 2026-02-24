import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout"
import { BackButton } from "@/presentation/components/ui/BackButton"
import { GradebookContent } from "@/presentation/components/teacher/gradebook/GradebookContent"
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { useToastStore } from "@/shared/store/useToastStore"
import { getClassById } from "@/business/services/classService"
import type { Class } from "@/business/models/dashboard/types"

/**
 * Standalone gradebook route page.
 * Reuses GradebookContent so the same UI can be rendered in the class "Grades" tab.
 */
export function GradebookPage() {
  const navigate = useNavigate()
  const { classId } = useParams<{ classId: string }>()
  const currentUser = useAuthStore((state) => state.user)
  const showToast = useToastStore((state) => state.showToast)
  const [classInfo, setClassInfo] = useState<Class | null>(null)

  const parsedClassId = classId ? parseInt(classId, 10) : 0
  const isValidClassId = !isNaN(parsedClassId) && parsedClassId > 0

  useEffect(() => {
    if (!isValidClassId) {
      showToast("Invalid class ID", "error")
      navigate("/dashboard")
    }
  }, [isValidClassId, navigate, showToast])

  useEffect(() => {
    if (!currentUser) {
      navigate("/login")
      return
    }

    if (currentUser.role !== "teacher" && currentUser.role !== "admin") {
      navigate("/dashboard")
      showToast("Only teachers can access the gradebook", "error")
      return
    }

    const loadClassInfo = async () => {
      try {
        const info = await getClassById(parsedClassId)
        setClassInfo(info)
      } catch (error) {
        console.error("Failed to load class info:", error)
      }
    }

    if (parsedClassId > 0) {
      void loadClassInfo()
    }
  }, [currentUser, navigate, parsedClassId, showToast])

  const userInitials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = useTopBar({ user: currentUser, userInitials })

  return (
    <DashboardLayout topBar={topBar}>
      <div className="mb-6">
        <BackButton to={`/dashboard/classes/${classId}`} />
      </div>

      <GradebookContent
        classId={parsedClassId}
        classCode={classInfo?.classCode}
      />
    </DashboardLayout>
  )
}
