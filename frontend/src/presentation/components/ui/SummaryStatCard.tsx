import type { ElementType } from "react"
import { Card, CardContent } from "@/presentation/components/ui/Card"
import { cn } from "@/shared/utils/cn"

interface SummaryStatCardProps {
  label: string
  value: string | number
  helperText?: string
  icon: ElementType
  className?: string
  iconContainerClassName?: string
  iconClassName?: string
  valueClassName?: string
}

/**
 * Displays a compact summary metric card with an icon, label, and value.
 *
 * @param label - The metric label shown above the value.
 * @param value - The metric value shown in emphasized text.
 * @param helperText - Optional supporting text shown below the value.
 * @param icon - Icon component rendered inside the icon container.
 * @param className - Optional additional classes for the outer card.
 * @param iconContainerClassName - Optional additional classes for the icon container.
 * @param iconClassName - Optional additional classes for the icon component.
 * @param valueClassName - Optional additional classes for the metric value text.
 * @returns A styled summary stat card element.
 */
export function SummaryStatCard({
  label,
  value,
  helperText,
  icon: Icon,
  className,
  iconContainerClassName,
  iconClassName,
  valueClassName,
}: SummaryStatCardProps) {
  return (
    <Card className={cn("bg-white/5 backdrop-blur-sm border-white/10", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              iconContainerClassName,
            )}
          >
            <Icon className={cn("w-5 h-5", iconClassName)} />
          </div>

          <div>
            <p className="text-sm text-slate-300">{label}</p>
            <p className={cn("text-xl font-bold text-white", valueClassName)}>
              {value}
            </p>
            {helperText ? (
              <p className="text-xs text-slate-400 mt-0.5">{helperText}</p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
