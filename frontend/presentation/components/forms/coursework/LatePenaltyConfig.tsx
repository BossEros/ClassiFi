import { useState } from "react";
import { Clock, Plus, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { Input } from "@/presentation/components/ui/Input";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/presentation/components/ui/Card";
import { Button } from "@/presentation/components/ui/Button";
import type {
  LatePenaltyConfig as LatePenaltyConfigType,
  PenaltyTier,
} from "@/data/api/types";

interface LatePenaltyConfigProps {
  enabled: boolean;
  config: LatePenaltyConfigType;
  onEnabledChange: (enabled: boolean) => void;
  onConfigChange: (config: LatePenaltyConfigType) => void;
  disabled?: boolean;
}

const DEFAULT_CONFIG: LatePenaltyConfigType = {
  gracePeriodHours: 1,
  tiers: [
    { hoursAfterGrace: 24, penaltyPercent: 10 },
    { hoursAfterGrace: 48, penaltyPercent: 25 },
    { hoursAfterGrace: 72, penaltyPercent: 50 },
  ],
  rejectAfterHours: 120,
};

export function LatePenaltyConfig({
  enabled,
  config,
  onEnabledChange,
  onConfigChange,
  disabled = false,
}: LatePenaltyConfigProps) {
  const [showPreview, setShowPreview] = useState(false);

  const handleGracePeriodChange = (value: number) => {
    onConfigChange({
      ...config,
      gracePeriodHours: Math.max(0, value),
    });
  };

  const handleRejectAfterChange = (value: number | null) => {
    onConfigChange({
      ...config,
      rejectAfterHours: value,
    });
  };

  const handleTierChange = (
    index: number,
    field: keyof PenaltyTier,
    value: number,
  ) => {
    const newTiers = [...config.tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    onConfigChange({ ...config, tiers: newTiers });
  };

  const handleAddTier = () => {
    const lastTier = config.tiers[config.tiers.length - 1];
    const newTier: PenaltyTier = {
      hoursAfterGrace: (lastTier?.hoursAfterGrace ?? 0) + 24,
      penaltyPercent: Math.min((lastTier?.penaltyPercent ?? 0) + 10, 100),
    };
    onConfigChange({ ...config, tiers: [...config.tiers, newTier] });
  };

  const handleRemoveTier = (index: number) => {
    const newTiers = config.tiers.filter((_, i) => i !== index);
    onConfigChange({ ...config, tiers: newTiers });
  };

  const handleEnableDefault = () => {
    onEnabledChange(true);
    onConfigChange(DEFAULT_CONFIG);
  };

  return (
    <Card className="border-white/10">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <Clock className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Late Penalty
              </h3>
              <p className="text-xs text-gray-400">
                Configure penalties for late submissions
              </p>
            </div>
          </div>

          {/* Enable/Disable Toggle */}
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => {
                if (e.target.checked && config.tiers.length === 0) {
                  handleEnableDefault();
                } else {
                  onEnabledChange(e.target.checked);
                }
              }}
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
      </CardHeader>

      {enabled && (
        <CardContent className="space-y-4 pt-0">
          {/* Grace Period */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Grace Period (hours)
              </label>
              <Input
                type="number"
                value={config.gracePeriodHours}
                onChange={(e) =>
                  handleGracePeriodChange(parseInt(e.target.value) || 0)
                }
                min={0}
                max={168}
                disabled={disabled}
                className="text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                No penalty during this time
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Reject After (hours)
              </label>
              <Input
                type="number"
                value={config.rejectAfterHours ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  handleRejectAfterChange(val ? parseInt(val) : null);
                }}
                min={1}
                placeholder="Never"
                disabled={disabled}
                className="text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to always accept
              </p>
            </div>
          </div>

          {/* Penalty Tiers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-400">
                Penalty Tiers
              </label>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs text-purple-400 hover:text-purple-300"
              >
                {showPreview ? "Hide Preview" : "Show Preview"}
              </button>
            </div>

            <div className="space-y-2">
              {config.tiers.map((tier, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        After (hours)
                      </label>
                      <Input
                        type="number"
                        value={tier.hoursAfterGrace}
                        onChange={(e) =>
                          handleTierChange(
                            index,
                            "hoursAfterGrace",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        min={1}
                        disabled={disabled}
                        className="text-sm h-8"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Penalty (%)
                      </label>
                      <Input
                        type="number"
                        value={tier.penaltyPercent}
                        onChange={(e) =>
                          handleTierChange(
                            index,
                            "penaltyPercent",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        min={0}
                        max={100}
                        disabled={disabled}
                        className="text-sm h-8"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTier(index)}
                    disabled={disabled || config.tiers.length <= 1}
                    className={cn(
                      "p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors",
                      (disabled || config.tiers.length <= 1) &&
                        "opacity-50 cursor-not-allowed",
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

          {/* Preview */}
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
                <li>• 0-{config.gracePeriodHours}h late: No penalty</li>
                {config.tiers.map((tier, i) => {
                  const prevHours =
                    i === 0
                      ? config.gracePeriodHours
                      : config.tiers[i - 1].hoursAfterGrace;
                  return (
                    <li key={i}>
                      • {prevHours}-{tier.hoursAfterGrace}h late: -
                      {tier.penaltyPercent}%
                    </li>
                  );
                })}
                {config.rejectAfterHours && (
                  <li className="text-red-400">
                    • After {config.rejectAfterHours}h: Rejected
                  </li>
                )}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export { DEFAULT_CONFIG as DEFAULT_LATE_PENALTY_CONFIG };
