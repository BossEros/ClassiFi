import type { ElementType } from "react"
import { Card, CardContent } from "@/presentation/components/ui/Card"
import { cn } from "@/shared/utils/cn"

interface SummaryStatCardProps {
  label: string
  value: string | number
  helperText?: string
  icon: ElementType
  variant?: "dark" | "light"
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
 * @param variant - Visual theme variant for dark or light dashboard surfaces.
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
  variant = "dark",
  className,
  iconContainerClassName,
  iconClassName,
  valueClassName,
}: SummaryStatCardProps) {
  const isLight = variant === "light"

  return (
    <Card
      className={cn(
        isLight
          ? "border-slate-200 bg-white shadow-sm"
          : "border-white/10 bg-white/5 backdrop-blur-sm",
        className,
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              iconContainerClassName,
            )}
          >
            <Icon className={cn("w-5 h-5", iconClassName)} />
          </div>

          <div>
            <p
              className={cn(
                "text-sm",
                isLight ? "text-slate-500" : "text-slate-300",
              )}
            >
              {label}
            </p>
            <p
              className={cn(
                "text-xl font-bold",
                isLight ? "text-slate-900" : "text-white",
                valueClassName,
              )}
            >
              {value}
            </p>
            {helperText ? (
              <p
                className={cn(
                  "mt-0.5 text-xs",
                  isLight ? "text-slate-400" : "text-slate-400",
                )}
              >
                {helperText}
              </p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
