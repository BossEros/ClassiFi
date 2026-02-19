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
} from "@/shared/types/gradebook"

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
  const [tierDraftValues, setTierDraftValues] = useState<Record<string, string>>(
    {},
  )

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
      handleTierChange(tierId, field, parsedValue)
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
    }

    setTierDraftValues((prevDraftValues) => {
      const nextDraftValues = { ...prevDraftValues }
      delete nextDraftValues[draftKey]
      return nextDraftValues
    })
  }

  return (
    <Card className="border-white/10">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/20">
            <Clock className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <CardTitle>Late Submissions</CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-3">
          <div>
            <p className="text-sm font-medium text-white">
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
                "bg-gray-700 peer-checked:bg-orange-500",
                "peer-focus:ring-2 peer-focus:ring-orange-500/50",
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
                <label className="block text-sm font-medium text-gray-200 mb-2">
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
                  className="h-11 text-sm bg-[#1A2130] border-white/10 text-white placeholder:text-gray-500 rounded-xl transition-all duration-200 hover:bg-[#1A2130] hover:border-white/20 focus:bg-[#1A2130] focus:ring-blue-500/20 focus:border-blue-500/50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to always accept
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-200">
                  Penalty Tiers
                </label>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-xs text-orange-400 hover:text-orange-300"
                >
                  {showPreview ? "Hide Preview" : "Show Preview"}
                </button>
              </div>

              <div className="space-y-2">
                {config.tiers.map((tier) => (
                  <div
                    key={tier.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-300 mb-2">
                          Up To (hours late)
                        </label>
                        <Input
                          type="number"
                          value={
                            tierDraftValues[buildTierDraftKey(tier.id, "hoursLate")] ??
                            String(tier.hoursLate)
                          }
                          onChange={(e) =>
                            handleTierDraftChange(
                              tier.id,
                              "hoursLate",
                              e.target.value,
                            )
                          }
                          onBlur={() => handleTierDraftBlur(tier.id, "hoursLate")}
                          min={1}
                          disabled={disabled}
                          className="h-8 text-sm bg-[#1A2130] border-white/10 text-white placeholder:text-gray-500 rounded-xl transition-all duration-200 hover:bg-[#1A2130] hover:border-white/20 focus:bg-[#1A2130] focus:ring-blue-500/20 focus:border-blue-500/50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-300 mb-2">
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
                          className="h-8 text-sm bg-[#1A2130] border-white/10 text-white placeholder:text-gray-500 rounded-xl transition-all duration-200 hover:bg-[#1A2130] hover:border-white/20 focus:bg-[#1A2130] focus:ring-blue-500/20 focus:border-blue-500/50"
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
                className="w-full mt-2 h-9 bg-white/5 hover:bg-white/10 text-white text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Tier
              </Button>
            </div>

            {showPreview && (
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div className="flex items-start gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-orange-400">
                      Penalty Preview
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Based on your configuration:
                    </p>
                  </div>
                </div>

                <ul className="text-xs text-gray-300 space-y-1 ml-6">
                  {config.tiers.map((tier, index) => {
                    const previousHours =
                      index === 0 ? 0 : config.tiers[index - 1].hoursLate

                    return (
                      <li key={tier.id}>
                        {previousHours}-{tier.hoursLate}h late: -
                        {tier.penaltyPercent}%
                      </li>
                    )
                  })}
                  {config.rejectAfterHours && (
                    <li className="text-red-400">
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
