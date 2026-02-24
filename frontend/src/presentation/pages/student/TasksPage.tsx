import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/Card"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar"

export function TasksPage() {
  const currentUser = useAuthStore((state) => state.user)

  const userInitials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = useTopBar({ user: currentUser, userInitials })

  return (
    <DashboardLayout topBar={topBar}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">All Tasks</h1>
        <p className="text-gray-400">
          View and manage all tasks and assignments
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
          <CardDescription>
            This page will display all your tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Tasks listing coming soon...</p>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
