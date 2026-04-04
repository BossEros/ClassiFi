import { useState } from "react"
import { Clock, Plus, Trash2, AlertTriangle } from "lucide-react"
import { cn } from "@/shared/utils/cn"
import { Input } from "@/presentation/components/ui/Input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/Card"
import { Button } from "@/presentation/components/ui/Button"
import type {
  LatePenaltyConfig as LatePenaltyConfigType,
  PenaltyTier,
} from "@/business/models/gradebook"
import { assignmentFormTheme } from "@/presentation/constants/assignmentFormTheme"

interface LatePenaltyConfigProps {
  enabled: boolean
  config: LatePenaltyConfigType
  onEnabledChange: (enabled: boolean) => void
  onConfigChange: (config: LatePenaltyConfigType) => void
  disabled?: boolean
}

const DEFAULT_CONFIG: LatePenaltyConfigType = {
  tiers: [
    { id: "default-1", hoursLate: 24, penaltyPercent: 10 },
    { id: "default-2", hoursLate: 48, penaltyPercent: 25 },
    { id: "default-3", hoursLate: 72, penaltyPercent: 50 },
  ],
  rejectAfterHours: 120,
}

function generateTierId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID()
  }

  return `tier-${Math.random().toString(36).slice(2, 10)}`
}

export function LatePenaltyConfig({
  enabled,
  config,
  onEnabledChange,
  onConfigChange,
  disabled = false,
}: LatePenaltyConfigProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [tierDraftValues, setTierDraftValues] = useState<
    Record<string, string>
  >({})

  const handleRejectAfterChange = (value: number | null) => {
    onConfigChange({
      ...config,
      rejectAfterHours: value,
    })
  }

  const handleTierChange = (
    id: string,
    field: keyof Omit<PenaltyTier, "id">,
    value: number,
  ) => {
    const newTiers = config.tiers.map((tier) =>
      tier.id === id ? { ...tier, [field]: value } : tier,
    )
    onConfigChange({ ...config, tiers: newTiers })
  }

  const handleAddTier = () => {
    const lastTier = config.tiers[config.tiers.length - 1]
    const newTier: PenaltyTier = {
      id: generateTierId(),
      hoursLate: (lastTier?.hoursLate ?? 0) + 24,
      penaltyPercent: Math.min((lastTier?.penaltyPercent ?? 0) + 10, 100),
    }
    onConfigChange({ ...config, tiers: [...config.tiers, newTier] })
  }

  const handleRemoveTier = (id: string) => {
    const newTiers = config.tiers.filter((tier) => tier.id !== id)
    onConfigChange({ ...config, tiers: newTiers })
    setTierDraftValues((prevDraftValues) => {
      const nextDraftValues = { ...prevDraftValues }
      delete nextDraftValues[buildTierDraftKey(id, "hoursLate")]
      delete nextDraftValues[buildTierDraftKey(id, "penaltyPercent")]
      return nextDraftValues
    })
  }

  const buildTierDraftKey = (
    tierId: string,
    field: keyof Omit<PenaltyTier, "id">,
  ): string => `${tierId}:${field}`

  const handleTierDraftChange = (
    tierId: string,
    field: keyof Omit<PenaltyTier, "id">,
    rawValue: string,
  ) => {
    if (!/^\d*$/.test(rawValue)) {
      return
    }

    const draftKey = buildTierDraftKey(tierId, field)

    setTierDraftValues((prevDraftValues) => ({
      ...prevDraftValues,
      [draftKey]: rawValue,
    }))

    if (rawValue === "") {
      return
    }

    const parsedValue = parseInt(rawValue, 10)

    if (!Number.isNaN(parsedValue)) {
      const sanitizedValue =
        field === "penaltyPercent"
          ? Math.min(100, Math.max(0, parsedValue))
          : parsedValue

      handleTierChange(tierId, field, sanitizedValue)
    }
  }

  const handleTierDraftBlur = (
    tierId: string,
    field: keyof Omit<PenaltyTier, "id">,
  ) => {
    const draftKey = buildTierDraftKey(tierId, field)
    const draftValue = tierDraftValues[draftKey]

    if (draftValue === undefined) {
      return
    }

    if (draftValue === "") {
      handleTierChange(tierId, field, 0)
    } else {
      const parsedValue = parseInt(draftValue, 10)

      if (!Number.isNaN(parsedValue)) {
        const sanitizedValue =
          field === "penaltyPercent"
            ? Math.min(100, Math.max(0, parsedValue))
            : parsedValue

        handleTierChange(tierId, field, sanitizedValue)
      }
    }

    setTierDraftValues((prevDraftValues) => {
      const nextDraftValues = { ...prevDraftValues }
      delete nextDraftValues[draftKey]
      return nextDraftValues
    })
  }

  const sortedPreviewTiers = [...config.tiers].sort(
    (a, b) => a.hoursLate - b.hoursLate,
  )
  const highestPreviewTierHours =
    sortedPreviewTiers[sortedPreviewTiers.length - 1]?.hoursLate ?? 0

  return (
    <Card className={assignmentFormTheme.sectionCard}>
      <CardHeader className={`${assignmentFormTheme.sectionHeader} pb-4`}>
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-700" />
          <div>
            <CardTitle className="text-slate-900">Late Submissions</CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div>
            <p className="text-sm font-medium text-slate-700">
              Allow late submissions
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
                "bg-slate-300 peer-checked:bg-amber-500",
                "peer-focus:ring-2 peer-focus:ring-amber-500/30",
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
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Reject After (hours)
                </label>
                <Input
                  type="number"
                  value={config.rejectAfterHours ?? ""}
                  onChange={(e) => {
                    const inputValue = e.target.value
                    handleRejectAfterChange(
                      inputValue ? parseInt(inputValue, 10) : null,
                    )
                  }}
                  min={1}
                  placeholder="Never"
                  disabled={disabled}
                  className="h-11 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all duration-200 hover:border-slate-400 hover:bg-white focus:border-teal-500/60 focus:bg-white focus:ring-teal-500/20"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Leave empty to always accept
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">
                  Penalty Tiers
                </label>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="cursor-pointer text-xs font-medium text-amber-700 hover:text-amber-800"
                >
                  {showPreview ? "Hide Preview" : "Show Preview"}
                </button>
              </div>

              <div className="space-y-2">
                {config.tiers.map((tier) => (
                  <div
                    key={tier.id}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2"
                  >
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-2 block text-xs font-medium text-slate-500">
                          Up To (hours late)
                        </label>
                        <Input
                          type="number"
                          value={
                            tierDraftValues[
                              buildTierDraftKey(tier.id, "hoursLate")
                            ] ?? String(tier.hoursLate)
                          }
                          onChange={(e) =>
                            handleTierDraftChange(
                              tier.id,
                              "hoursLate",
                              e.target.value,
                            )
                          }
                          onBlur={() =>
                            handleTierDraftBlur(tier.id, "hoursLate")
                          }
                          min={1}
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
                            tierDraftValues[
                              buildTierDraftKey(tier.id, "penaltyPercent")
                            ] ?? String(tier.penaltyPercent)
                          }
                          onChange={(e) =>
                            handleTierDraftChange(
                              tier.id,
                              "penaltyPercent",
                              e.target.value,
                            )
                          }
                          onBlur={() =>
                            handleTierDraftBlur(tier.id, "penaltyPercent")
                          }
                          min={0}
                          max={100}
                          disabled={disabled}
                          className="h-8 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all duration-200 hover:border-slate-400 focus:border-teal-500/60 focus:ring-teal-500/20"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveTier(tier.id)}
                      disabled={disabled}
                      className={cn(
                        "p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors",
                        disabled && "opacity-50 cursor-not-allowed",
                      )}
                      title="Remove tier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                onClick={handleAddTier}
                disabled={disabled || config.tiers.length >= 5}
                className="mt-2 h-9 w-full border border-dashed border-slate-300 bg-white text-sm text-slate-700 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Tier
              </Button>
            </div>

            {showPreview && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-start gap-2 mb-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Penalty Preview
                    </p>
                    <p className="mt-1 text-xs text-amber-700">
                      Based on your configuration:
                    </p>
                  </div>
                </div>

                <ul className="ml-6 space-y-1 text-xs text-slate-700">
                  {sortedPreviewTiers.map((tier, index) => {
                    const previousHours =
                      index === 0 ? 0 : sortedPreviewTiers[index - 1].hoursLate

                    return (
                      <li key={tier.id}>
                        {previousHours}-{tier.hoursLate}h late: -
                        {tier.penaltyPercent}%
                      </li>
                    )
                  })}
                  {config.rejectAfterHours != null &&
                    config.rejectAfterHours >= highestPreviewTierHours && (
                      <li className="text-rose-700">
                        After {config.rejectAfterHours}h: Rejected
                      </li>
                    )}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export { DEFAULT_CONFIG as DEFAULT_LATE_PENALTY_CONFIG }

