import { useId, useState } from "react"
import { ChevronDown, FileText } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/Card"
import { cn } from "@/shared/utils/cn"

interface CollapsibleInstructionsProps {
  instructions: string
  instructionsImageUrl?: string | null
  assignmentName: string
  defaultExpanded?: boolean
}

export function CollapsibleInstructions({
  instructions,
  instructionsImageUrl,
  assignmentName,
  defaultExpanded = false,
}: CollapsibleInstructionsProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const instructionsPanelId = useId()

  const normalizedInstructions = instructions.trim()
  const canExpand =
    normalizedInstructions.length > 0 || Boolean(instructionsImageUrl)

  const handleToggleExpanded = () => {
    if (!canExpand) {
      return
    }

    setIsExpanded((previousValue) => !previousValue)
  }

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
      <CardHeader>
        <button
          type="button"
          onClick={handleToggleExpanded}
          disabled={!canExpand}
          aria-expanded={isExpanded}
          aria-controls={instructionsPanelId}
          className={cn(
            "w-full flex items-center justify-between gap-4 text-left",
            canExpand ? "cursor-pointer" : "cursor-default",
          )}
        >
          <div className="flex items-center gap-2.5">
            <FileText className="h-4 w-4 text-slate-300" />
            <CardTitle>Instructions</CardTitle>
          </div>
          {canExpand && (
            <ChevronDown
              className={cn(
                "h-4 w-4 text-slate-300 transition-transform duration-200",
                isExpanded && "rotate-180",
              )}
            />
          )}
        </button>
      </CardHeader>
      {isExpanded && (
        <CardContent id={instructionsPanelId}>
          <div className="space-y-4">
            {normalizedInstructions ? (
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
                {normalizedInstructions}
              </p>
            ) : (
              <p className="text-gray-400 text-sm">No instructions provided.</p>
            )}

            {instructionsImageUrl && (
              <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20">
                <img
                  src={instructionsImageUrl}
                  alt={`${assignmentName} instructions`}
                  className="w-full max-h-[28rem] object-contain bg-black/30"
                />
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
