import { useState } from "react"
import { ShieldAlert, Plus, Trash2, AlertTriangle } from "lucide-react"
import { cn } from "@/shared/utils/cn"
import { Input } from "@/presentation/components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/Card"
import { Button } from "@/presentation/components/ui/Button"
import type { SimilarityPenaltyConfig as SimilarityPenaltyConfigType, SimilarityPenaltyBand } from "@/business/models/gradebook"
import { assignmentFormTheme } from "@/presentation/constants/assignmentFormTheme"

interface SimilarityPenaltyConfigProps {
  enabled: boolean
  config: SimilarityPenaltyConfigType
  onEnabledChange: (enabled: boolean) => void
  onConfigChange: (config: SimilarityPenaltyConfigType) => void
  disabled?: boolean
}

const DEFAULT_CONFIG: SimilarityPenaltyConfigType = {
  warningThreshold: 0.75,
  deductionBands: [
    { id: "default-1", minHybridScore: 0.85, penaltyPercent: 5 },
    { id: "default-2", minHybridScore: 0.90, penaltyPercent: 10 },
    { id: "default-3", minHybridScore: 0.95, penaltyPercent: 20 },
  ],
  maxPenaltyPercent: 20,
  applyHighestPairOnly: true,
}

function generateBandId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID()
  }

  return `band-${Math.random().toString(36).slice(2, 10)}`
}

export function SimilarityPenaltyConfig({
  enabled,
  config,
  onEnabledChange,
  onConfigChange,
  disabled = false,
}: SimilarityPenaltyConfigProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [bandDraftValues, setBandDraftValues] = useState<Record<string, string>>({})
  const [maxPenaltyDraft, setMaxPenaltyDraft] = useState<string | null>(null)

  const handleMaxPenaltyChange = (rawValue: string) => {
    if (!/^\d*$/.test(rawValue)) {
      return
    }

    setMaxPenaltyDraft(rawValue)

    if (rawValue === "") {
      return
    }

    const parsedValue = parseInt(rawValue, 10)

    if (!Number.isNaN(parsedValue)) {
      onConfigChange({ ...config, maxPenaltyPercent: Math.min(100, Math.max(0, parsedValue)) })
    }
  }

  const handleMaxPenaltyBlur = () => {
    if (maxPenaltyDraft === null) {
      return
    }

    if (maxPenaltyDraft === "") {
      onConfigChange({ ...config, maxPenaltyPercent: 0 })
    }

    setMaxPenaltyDraft(null)
  }

  const buildBandDraftKey = (bandId: string, field: keyof Omit<SimilarityPenaltyBand, "id">): string =>
    `${bandId}:${field}`

  const handleBandDraftChange = (
    bandId: string,
    field: keyof Omit<SimilarityPenaltyBand, "id">,
    rawValue: string,
  ) => {
    if (!/^\d*\.?\d*$/.test(rawValue)) {
      return
    }

    const draftKey = buildBandDraftKey(bandId, field)

    setBandDraftValues((prevDraftValues) => ({ ...prevDraftValues, [draftKey]: rawValue }))

    if (rawValue === "") {
      return
    }

    const parsedValue = parseFloat(rawValue)

    if (!Number.isNaN(parsedValue)) {
      handleBandChange(bandId, field, parsedValue)
    }
  }

  const handleBandDraftBlur = (bandId: string, field: keyof Omit<SimilarityPenaltyBand, "id">) => {
    const draftKey = buildBandDraftKey(bandId, field)
    const draftValue = bandDraftValues[draftKey]

    if (draftValue === undefined) {
      return
    }

    if (draftValue === "") {
      handleBandChange(bandId, field, 0)
    } else {
      const parsedValue = parseFloat(draftValue)

      if (!Number.isNaN(parsedValue)) {
        handleBandChange(bandId, field, parsedValue)
      }
    }

    setBandDraftValues((prevDraftValues) => {
      const nextDraftValues = { ...prevDraftValues }
      delete nextDraftValues[draftKey]
      return nextDraftValues
    })
  }

  const handleBandChange = (
    bandId: string,
    field: keyof Omit<SimilarityPenaltyBand, "id">,
    value: number,
  ) => {
    const sanitizedValue =
      field === "minHybridScore"
        ? Math.min(1, Math.max(0, value / 100))
        : Math.min(100, Math.max(0, value))

    const newBands = config.deductionBands.map((band) =>
      band.id === bandId ? { ...band, [field]: sanitizedValue } : band,
    )

    onConfigChange({ ...config, deductionBands: newBands })
  }

  const handleAddBand = () => {
    const lastBand = config.deductionBands[config.deductionBands.length - 1]
    const newBand: SimilarityPenaltyBand = {
      id: generateBandId(),
      minHybridScore: Math.min(((lastBand?.minHybridScore ?? 0.80) + 0.05), 1),
      penaltyPercent: Math.min(((lastBand?.penaltyPercent ?? 0) + 5), 100),
    }
    onConfigChange({ ...config, deductionBands: [...config.deductionBands, newBand] })
  }

  const handleRemoveBand = (bandId: string) => {
    const newBands = config.deductionBands.filter((band) => band.id !== bandId)
    onConfigChange({ ...config, deductionBands: newBands })
    setBandDraftValues((prevDraftValues) => {
      const nextDraftValues = { ...prevDraftValues }
      delete nextDraftValues[buildBandDraftKey(bandId, "minHybridScore")]
      delete nextDraftValues[buildBandDraftKey(bandId, "penaltyPercent")]
      return nextDraftValues
    })
  }

  const sortedPreviewBands = [...config.deductionBands].sort(
    (a, b) => a.minHybridScore - b.minHybridScore,
  )

  return (
    <Card className={assignmentFormTheme.sectionCard}>
      <CardHeader className={`${assignmentFormTheme.sectionHeader} pb-4`}>
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-700" />
          <div>
            <CardTitle className="text-slate-900">Similarity Penalty</CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div>
            <p className="text-sm font-medium text-slate-700">
              Deduct score based on similarity
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onEnabledChange(e.target.checked)}
              disabled={disabled}
              className="sr-only peer"
            />
            <div
              className={cn(
                "w-11 h-6 rounded-full transition-colors duration-200",
                "bg-slate-300 peer-checked:bg-rose-500",
                "peer-focus:ring-2 peer-focus:ring-rose-500/30",
                "after:content-[''] after:absolute after:top-0.5 after:left-0.5",
                "after:w-5 after:h-5 after:rounded-full after:bg-white after:shadow-lg",
                "after:transition-transform peer-checked:after:translate-x-5",
                disabled && "opacity-50 cursor-not-allowed",
              )}
            />
          </label>
        </div>

        {enabled && (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Max Penalty (%)
              </label>
              <Input
                type="number"
                value={maxPenaltyDraft ?? config.maxPenaltyPercent}
                onChange={(e) => handleMaxPenaltyChange(e.target.value)}
                onBlur={handleMaxPenaltyBlur}
                min={0}
                max={100}
                disabled={disabled}
                className="h-11 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all duration-200 hover:border-slate-400 hover:bg-white focus:border-teal-500/60 focus:bg-white focus:ring-teal-500/20"
              />
              <p className="mt-1 text-xs text-slate-500">
                Cap the automatic deduction at this value
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">
                  Deduction Bands
                </label>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="cursor-pointer text-xs font-medium text-rose-700 hover:text-rose-800"
                >
                  {showPreview ? "Hide Preview" : "Show Preview"}
                </button>
              </div>

              <div className="space-y-2">
                {config.deductionBands.map((band) => (
                  <div
                    key={band.id}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2"
                  >
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-2 block text-xs font-medium text-slate-500">
                          Min Score (%)
                        </label>
                        <Input
                          type="number"
                          value={
                            bandDraftValues[buildBandDraftKey(band.id, "minHybridScore")] ??
                            String(Math.round(band.minHybridScore * 100))
                          }
                          onChange={(e) =>
                            handleBandDraftChange(band.id, "minHybridScore", e.target.value)
                          }
                          onBlur={() => handleBandDraftBlur(band.id, "minHybridScore")}
                          min={0}
                          max={100}
                          disabled={disabled}
                          className="h-8 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all duration-200 hover:border-slate-400 focus:border-teal-500/60 focus:ring-teal-500/20"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-medium text-slate-500">
                          Penalty (%)
                        </label>
                        <Input
                          type="number"
                          value={
                            bandDraftValues[buildBandDraftKey(band.id, "penaltyPercent")] ??
                            String(band.penaltyPercent)
                          }
                          onChange={(e) =>
                            handleBandDraftChange(band.id, "penaltyPercent", e.target.value)
                          }
                          onBlur={() => handleBandDraftBlur(band.id, "penaltyPercent")}
                          min={0}
                          max={100}
                          disabled={disabled}
                          className="h-8 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all duration-200 hover:border-slate-400 focus:border-teal-500/60 focus:ring-teal-500/20"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveBand(band.id)}
                      disabled={disabled}
                      className={cn(
                        "p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors",
                        disabled && "opacity-50 cursor-not-allowed",
                      )}
                      title="Remove band"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                onClick={handleAddBand}
                disabled={disabled || config.deductionBands.length >= 5}
                className="mt-2 h-9 w-full border border-dashed border-slate-300 bg-white text-sm text-slate-700 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Band
              </Button>
            </div>

            {showPreview && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                <div className="flex items-start gap-2 mb-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />
                  <div>
                    <p className="text-sm font-medium text-rose-800">
                      Penalty Preview
                    </p>
                    <p className="mt-1 text-xs text-rose-700">
                      Based on your configuration:
                    </p>
                  </div>
                </div>

                <ul className="ml-6 space-y-1 text-xs text-slate-700">
                  {sortedPreviewBands.map((band) => (
                    <li key={band.id}>
                      â‰¥ {Math.round(band.minHybridScore * 100)}% similarity: -{band.penaltyPercent}%
                    </li>
                  ))}
                  <li className="text-rose-700">
                    Max deduction capped at {config.maxPenaltyPercent}%
                  </li>
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export { DEFAULT_CONFIG as DEFAULT_SIMILARITY_PENALTY_CONFIG }

