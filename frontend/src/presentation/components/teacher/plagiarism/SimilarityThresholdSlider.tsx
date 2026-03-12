interface SimilarityThresholdSliderProps {
  /** Active threshold percentage shared across plagiarism views. */
  minimumSimilarityPercent: number
  /** Minimum allowed threshold percentage. */
  min: number
  /** Maximum allowed threshold percentage. */
  max: number
  /** Slider step. */
  step?: number
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
  onMinimumSimilarityPercentChange,
}: SimilarityThresholdSliderProps) {
  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between gap-3 text-sm font-semibold text-slate-900">
        <span>Threshold</span>
        <span>
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
        className="block h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-teal-600"
        aria-label="Similarity threshold"
      />

      <div className="mt-2 flex items-center justify-between text-xs font-medium text-slate-500">
        <span>{min}%</span>
        <span>{max}%</span>
      </div>
    </div>
  )
}

export default SimilarityThresholdSlider
