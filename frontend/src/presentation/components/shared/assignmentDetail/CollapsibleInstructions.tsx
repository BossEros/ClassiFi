import { useMemo, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/Card"
import { Button } from "@/presentation/components/ui/Button"

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

  const normalizedInstructions = instructions.trim()
  const previewInstructions = useMemo(() => {
    const instructionLines = normalizedInstructions.split("\n")
    return instructionLines.slice(0, 2).join("\n").trim()
  }, [normalizedInstructions])

  const shouldShowToggle =
    normalizedInstructions.length > previewInstructions.length ||
    !!instructionsImageUrl

  const displayedInstructions = isExpanded
    ? normalizedInstructions
    : previewInstructions

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <CardTitle>Instructions</CardTitle>
          {shouldShowToggle && (
            <Button
              type="button"
              onClick={() => setIsExpanded((previousValue) => !previousValue)}
              className="bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 px-3 py-1.5 h-auto text-xs"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5 mr-1.5" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5 mr-1.5" />
                  Show more
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayedInstructions ? (
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
              {displayedInstructions}
            </p>
          ) : (
            <p className="text-gray-400 text-sm">No instructions provided.</p>
          )}

          {instructionsImageUrl && isExpanded && (
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
    </Card>
  )
}
