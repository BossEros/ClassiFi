interface SimilarityThresholdSliderProps {
  /** Active threshold percentage shared across plagiarism views. */
  minimumSimilarityPercent: number
  /** Minimum allowed threshold percentage. */
  min: number
  /** Maximum allowed threshold percentage. */
  max: number
  /** Slider step. */
  step?: number
  /** Visual density preset for layouts that need a larger control. */
  size?: "default" | "large"
  /** Optional wrapper class for layout-specific sizing. */
  className?: string
  /** When true, renders a short description explaining what the threshold controls. */
  showHelperText?: boolean
  /** Called whenever the threshold changes. */
  onMinimumSimilarityPercentChange: (minimumSimilarityPercent: number) => void
}

/**
 * Shared draggable threshold control for graph, cluster, and pairwise similarity views.
 *
 * @param props - Slider configuration and change handlers.
 * @returns Threshold label and range control.
 */
export function SimilarityThresholdSlider({
  minimumSimilarityPercent,
  min,
  max,
  step = 1,
  size = "default",
  className,
  showHelperText = false,
  onMinimumSimilarityPercentChange,
}: SimilarityThresholdSliderProps) {
  const isLargeSlider = size === "large"
  const wrapperClassName = className ? `w-full ${className}` : "w-full"
  const headerClassName = isLargeSlider
    ? "mb-4 flex items-center justify-between gap-4 text-base font-semibold text-slate-900"
    : "mb-3 flex items-center justify-between gap-3 text-sm font-semibold text-slate-900"
  const valueClassName = isLargeSlider ? "text-lg" : undefined
  const sliderClassName = isLargeSlider
    ? "block h-3 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-teal-600"
    : "block h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-teal-600"
  const scaleClassName = isLargeSlider
    ? "mt-3 flex items-center justify-between text-sm font-medium text-slate-500"
    : "mt-2 flex items-center justify-between text-xs font-medium text-slate-500"

  return (
    <div className={wrapperClassName}>
      <div className={headerClassName}>
        <span>Threshold</span>
        <span className={valueClassName}>
          {">="} {minimumSimilarityPercent}%
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={minimumSimilarityPercent}
        onChange={(event) =>
          onMinimumSimilarityPercentChange(Number(event.target.value))
        }
        className={sliderClassName}
        aria-label="Similarity threshold"
      />

      <div className={scaleClassName}>
        <span>{min}%</span>
        <span>{max}%</span>
      </div>

      {showHelperText && (
        <p className={isLargeSlider ? "mt-3 text-sm text-slate-500" : "mt-2 text-xs text-slate-500"}>
          Only submission pairs whose hybrid similarity score meets or exceeds
          this percentage will appear in the results. Drag right to focus on the
          most suspicious pairs; drag left to include more comparisons.
        </p>
      )}
    </div>
  )
}

export default SimilarityThresholdSlider
