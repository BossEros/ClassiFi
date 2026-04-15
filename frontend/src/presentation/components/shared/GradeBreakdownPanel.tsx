import { CheckCircle2, Clock3, FlaskConical, Search, TrendingDown, User } from "lucide-react"
import { cn } from "@/shared/utils/cn"
import type { GradeBreakdown } from "@/data/api/gradebook.types"

interface GradeBreakdownPanelProps {
  breakdown: GradeBreakdown
  totalScore: number
  submittedAt?: string | Date | null
  deadline?: string | Date | null
  testsPassed?: number | null
  testsTotal?: number | null
  overrideReason?: string | null
  variant?: "dark" | "light"
  className?: string
}

/**
 * Formats the duration between two dates into a human-readable late duration string.
 *
 * @param submittedAt - The submission timestamp.
 * @param deadline - The assignment deadline timestamp.
 * @returns A formatted string like "2 days, 3 hours late" or null if not late.
 */
function formatLateDuration(submittedAt: Date, deadline: Date): string | null {
  const diffMs = submittedAt.getTime() - deadline.getTime()
  if (diffMs <= 0) return null

  const totalMinutes = Math.floor(diffMs / 60_000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60

  const parts: string[] = []
  if (days > 0) parts.push(`${days} ${days === 1 ? "day" : "days"}`)
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hr" : "hrs"}`)
  if (days === 0 && minutes > 0) parts.push(`${minutes} ${minutes === 1 ? "min" : "mins"}`)

  return parts.length > 0 ? `Submitted ${parts.join(", ")} after the deadline` : null
}

/**
 * Renders a grade breakdown panel showing how the displayed grade was computed
 * from the original test score, automatic deductions, and an optional manual override.
 * Always renders when an original grade is available, even without deductions.
 */
export function GradeBreakdownPanel({
  breakdown,
  totalScore,
  submittedAt,
  deadline,
  testsPassed,
  testsTotal,
  overrideReason,
  variant = "light",
  className,
}: GradeBreakdownPanelProps) {
  const hasLatePenalty = breakdown.latePenaltyPercent > 0
  const hasSimilarityPenalty = breakdown.similarityPenaltyPercent > 0
  const hasOriginalGrade = breakdown.originalGrade !== null
  const hasManualOverride =
    breakdown.isOverridden && breakdown.effectiveGrade !== null
  const isDark = variant === "dark"

  if (!hasOriginalGrade) return null

  const originalScore = breakdown.originalGrade
  const latePenaltyPoints =
    hasLatePenalty ? Math.round(totalScore * (breakdown.latePenaltyPercent / 100)) : 0
  const similarityPenaltyPoints =
    hasSimilarityPenalty ? Math.round(totalScore * (breakdown.similarityPenaltyPercent / 100)) : 0
  const automaticFinalGrade = breakdown.finalGrade ?? breakdown.effectiveGrade ?? 0
  const displayedGrade = breakdown.effectiveGrade ?? breakdown.finalGrade ?? 0
  const displayedPercent =
    totalScore > 0 ? Math.round((displayedGrade / totalScore) * 100) : 0
  const summaryLabel = "Final Grade"
  const dividerClassName = cn("border-t", isDark ? "border-white/10" : "border-slate-100")

  const lateReason =
    hasLatePenalty && submittedAt && deadline
      ? formatLateDuration(new Date(submittedAt), new Date(deadline))
      : null

  const similarityReason = hasSimilarityPenalty
    ? breakdown.similarityScore !== null
      ? `${breakdown.similarityScore}% similarity detected`
      : null
    : null

  const testScoreReason =
    testsPassed != null && testsTotal != null
      ? `Passed ${testsPassed}/${testsTotal} test cases`
      : null

  const automaticFinalReason =
    hasLatePenalty || hasSimilarityPenalty
      ? "Score after automatic deductions"
      : "Score before any manual adjustment"

  return (
    <div
      className={cn(
        "mt-3 rounded-xl border p-4",
        isDark
          ? "border-white/10 bg-slate-800/80"
          : "border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      <div className="space-y-3">
        <BreakdownRow
          icon={<FlaskConical className="h-3.5 w-3.5" />}
          iconBg={isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-600"}
          label="Test Score"
          value={`${originalScore} / ${totalScore}`}
          reason={testScoreReason}
          variant={variant}
        />

        {hasLatePenalty && (
          <BreakdownRow
            icon={<Clock3 className="h-3.5 w-3.5" />}
            iconBg={isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-50 text-orange-600"}
            label={`Late Penalty (${breakdown.latePenaltyPercent}%)`}
            value={`-${latePenaltyPoints}`}
            reason={lateReason}
            isDeduction
            variant={variant}
          />
        )}

        {hasSimilarityPenalty && (
          <BreakdownRow
            icon={<Search className="h-3.5 w-3.5" />}
            iconBg={isDark ? "bg-rose-500/20 text-rose-400" : "bg-rose-50 text-rose-600"}
            label={`Similarity Penalty (${breakdown.similarityPenaltyPercent}%)`}
            value={`-${similarityPenaltyPoints}`}
            reason={similarityReason}
            isDeduction
            variant={variant}
          />
        )}

        <div className={dividerClassName} />

        {hasManualOverride && (
          <>
            <BreakdownRow
              icon={<TrendingDown className="h-3.5 w-3.5" />}
              iconBg={isDark ? "bg-sky-500/20 text-sky-400" : "bg-sky-50 text-sky-600"}
              label="Automatic Final"
              value={`${automaticFinalGrade} / ${totalScore}`}
              reason={automaticFinalReason}
              variant={variant}
            />

            <BreakdownRow
              icon={<User className="h-3.5 w-3.5" />}
              iconBg={isDark ? "bg-violet-500/20 text-violet-400" : "bg-violet-50 text-violet-600"}
              label="Manual Override"
              value={`${displayedGrade} / ${totalScore}`}
              reason={
                overrideReason?.trim()
                  ? `Reason: ${overrideReason.trim()}`
                  : "Reason: Manual score adjustment applied"
              }
              variant={variant}
            />

            <div className={dividerClassName} />
          </>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "flex items-center gap-2 text-xs font-semibold",
                isDark ? "text-white" : "text-slate-900",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-md",
                  isDark ? "bg-teal-500/20 text-teal-400" : "bg-teal-50 text-teal-600",
                )}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
              {summaryLabel}
            </span>
            <span
              className={cn(
                "text-sm font-bold tabular-nums",
                isDark ? "text-white" : "text-slate-900",
              )}
            >
              {displayedGrade} / {totalScore}
            </span>
          </div>

          <div
            className={cn(
              "h-1.5 w-full overflow-hidden rounded-full",
              isDark ? "bg-white/10" : "bg-slate-100",
            )}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all",
                displayedPercent >= 90
                  ? "bg-emerald-500"
                  : displayedPercent >= 75
                    ? "bg-sky-500"
                    : displayedPercent >= 60
                      ? "bg-amber-500"
                      : displayedPercent >= 40
                        ? "bg-orange-500"
                        : "bg-rose-500",
              )}
              style={{ width: `${Math.min(displayedPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

interface BreakdownRowProps {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string
  reason?: string | null
  isDeduction?: boolean
  variant?: "dark" | "light"
}

function BreakdownRow({
  icon,
  iconBg,
  label,
  value,
  reason,
  isDeduction = false,
  variant = "light",
}: BreakdownRowProps) {
  const isDark = variant === "dark"

  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-2 gap-y-1">
      <span
        className={cn(
          "inline-flex h-6 w-6 items-center justify-center rounded-md",
          iconBg,
        )}
      >
        {icon}
      </span>
      <span
        className={cn(
          "min-w-0 justify-self-start pt-1 text-left text-xs",
          isDark ? "text-slate-300" : "text-slate-600",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "pt-1 text-xs font-semibold tabular-nums text-right",
          isDeduction
            ? isDark ? "text-red-400" : "text-rose-600"
            : isDark ? "text-slate-200" : "text-slate-800",
        )}
      >
        {value}
      </span>
      {reason ? (
        <span
          className={cn(
            "col-start-2 min-w-0 justify-self-start pr-2 text-left text-[11px] italic leading-4",
            isDark ? "text-slate-500" : "text-slate-400",
          )}
        >
          {reason}
        </span>
      ) : null}
    </div>
  )
}
