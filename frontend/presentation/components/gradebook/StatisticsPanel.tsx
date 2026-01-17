import { Users, BookOpen, TrendingUp, CheckCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/presentation/components/ui/Card";
import type { ClassStatistics } from "@/data/api/types";

interface StatisticsPanelProps {
  statistics: ClassStatistics | null;
}

export function StatisticsPanel({ statistics }: StatisticsPanelProps) {
  if (!statistics) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-400 text-sm">Loading statistics...</p>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      label: "Class Average",
      value:
        statistics.classAverage !== null
          ? `${Math.round(statistics.classAverage)}%`
          : "—",
      icon: TrendingUp,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      label: "Submission Rate",
      value: `${Math.round(statistics.submissionRate)}%`,
      icon: CheckCircle,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Total Students",
      value: statistics.totalStudents.toString(),
      icon: Users,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Assignments",
      value: statistics.totalAssignments.toString(),
      icon: BookOpen,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-white">Class Statistics</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/5"
          >
            <div
              className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}
            >
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                {stat.label}
              </p>
              <p className="text-xl font-bold text-white">{stat.value}</p>
            </div>
          </div>
        ))}

        {/* Grade Distribution */}
        <div className="pt-4 border-t border-white/10">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
            Grade Legend
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-green-500/20"></span>
              <span className="text-xs text-gray-400">90-100% (Excellent)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-blue-500/20"></span>
              <span className="text-xs text-gray-400">75-89% (Good)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-yellow-500/20"></span>
              <span className="text-xs text-gray-400">60-74% (Average)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-orange-500/20"></span>
              <span className="text-xs text-gray-400">
                40-59% (Below Average)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-red-500/20"></span>
              <span className="text-xs text-gray-400">
                &lt;40% (Needs Improvement)
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
