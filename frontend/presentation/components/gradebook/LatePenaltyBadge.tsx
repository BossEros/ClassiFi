import { Clock } from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface LatePenaltyBadgeProps {
  penaltyPercent: number;
  small?: boolean;
  className?: string;
}

export function LatePenaltyBadge({
  penaltyPercent,
  small = false,
  className,
}: LatePenaltyBadgeProps) {
  if (penaltyPercent <= 0) return null;

  const isRejected = penaltyPercent >= 100;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium text-xs",
        small ? "px-1.5 py-0.5" : "px-2 py-1",
        isRejected
          ? "bg-red-500/20 text-red-400"
          : "bg-orange-500/20 text-orange-400",
        className,
      )}
      title={
        isRejected
          ? "Late submission rejected"
          : `${penaltyPercent}% late penalty applied`
      }
    >
      <Clock className={cn(small ? "w-2.5 h-2.5" : "w-3 h-3")} />
      {isRejected ? "Rejected" : `-${penaltyPercent}%`}
    </span>
  );
}
