import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { DashboardLayout } from "@/presentation/components/dashboard/DashboardLayout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/Card"
import { Clock } from "lucide-react"
import { getCurrentUser } from "@/business/services/authService"
import { useTopBar } from "@/presentation/components/dashboard/TopBar"
import type { User } from "@/shared/types/auth"

export function HistoryPage() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    const user = getCurrentUser()
    setCurrentUser(user)

    if (!user) {
      navigate("/login")
    }
  }, [navigate])

  const userInitials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = useTopBar({ user: currentUser, userInitials })

  return (
    <DashboardLayout topBar={topBar}>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Clock className="w-6 h-6 text-white" />
          <h1 className="text-3xl font-bold text-white">Analysis History</h1>
        </div>
        <p className="text-gray-400 ml-9">
          View your analysis and grading history
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analysis History</CardTitle>
          <CardDescription>
            This page will display your analysis history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Analysis history coming soon...</p>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
