import type { GradeEntry } from "@/data/api/types";
import { X, Edit2 } from "lucide-react";

interface GradeCellProps {
  grade: GradeEntry | null;
  totalScore: number;
  onClick: () => void;
}

export function GradeCell({ grade, totalScore, onClick }: GradeCellProps) {
  // No submission
  if (!grade || !grade.submissionId) {
    return (
      <span className="inline-flex items-center justify-center w-12 h-8 rounded text-xs text-gray-500">
        —
      </span>
    );
  }

  // Submitted but not graded yet
  if (grade.grade === null) {
    return (
      <button
        onClick={onClick}
        className="inline-flex items-center justify-center w-12 h-8 rounded bg-gray-700/50 text-gray-400 text-xs hover:bg-gray-700 transition-colors"
        title="Not graded yet - Click to override"
      >
        <X className="w-3 h-3" />
      </button>
    );
  }

  // Calculate percentage for color coding
  const percentage = (grade.grade / totalScore) * 100;
  const colorClass = getGradeColorClass(percentage);

  return (
    <button
      onClick={onClick}
      className={`group relative inline-flex items-center justify-center min-w-[48px] h-8 px-2 rounded text-sm font-medium transition-all ${colorClass} hover:ring-2 hover:ring-white/20`}
      title={`${grade.grade}/${totalScore} (${Math.round(percentage)}%) - Click to modify`}
    >
      <span>{grade.grade}</span>
      {grade.isOverridden && (
        <span className="ml-1" title="Manually overridden">
          <Edit2 className="w-3 h-3 text-yellow-400" />
        </span>
      )}

      {/* Hover overlay */}
      <span className="absolute inset-0 flex items-center justify-center bg-black/60 rounded opacity-0 group-hover:opacity-100 transition-opacity">
        <Edit2 className="w-4 h-4 text-white" />
      </span>
    </button>
  );
}

function getGradeColorClass(percentage: number): string {
  if (percentage >= 90) return "bg-green-500/20 text-green-400";
  if (percentage >= 75) return "bg-blue-500/20 text-blue-400";
  if (percentage >= 60) return "bg-yellow-500/20 text-yellow-400";
  if (percentage >= 40) return "bg-orange-500/20 text-orange-400";
  return "bg-red-500/20 text-red-400";
}
