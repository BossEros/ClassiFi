import { DashboardLayout } from "@/presentation/components/dashboard/DashboardLayout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/Card"
import { Clock } from "lucide-react"

export function HistoryPage() {
  return (
    <DashboardLayout>
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
