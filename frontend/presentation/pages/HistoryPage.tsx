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
import { getCurrentUser } from "@/business/services/authService"
import { useTopBar } from "@/presentation/components/dashboard/TopBar"

export function HistoryPage() {
  const navigate = useNavigate()
  const [currentUser] = useState(() => getCurrentUser())

  useEffect(() => {
    if (!currentUser) {
      navigate("/login")
    }
  }, [currentUser, navigate])

  const userInitials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = useTopBar({ user: currentUser, userInitials })

  return (
    <DashboardLayout topBar={topBar}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Analysis History
        </h1>
        <p className="text-gray-400">
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
