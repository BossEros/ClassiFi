import { DashboardLayout } from "@/presentation/components/dashboard/DashboardLayout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/Card"
import { List } from "lucide-react"

export function TasksPage() {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <List className="w-6 h-6 text-white" />
          <h1 className="text-3xl font-bold text-white">All Tasks</h1>
        </div>
        <p className="text-gray-400 ml-9">
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
