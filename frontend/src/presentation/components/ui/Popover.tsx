import * as React from "react"
import { cn } from "@/shared/utils/cn"

interface PopoverProps {
  trigger: React.ReactNode
  content: React.ReactNode
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  align?: "start" | "end" | "center"
  className?: string
}

export const Popover = React.forwardRef<HTMLDivElement, PopoverProps>(
  (
    { trigger, content, isOpen, onOpenChange, align = "start", className },
    forwardedRef,
  ) => {
    const internalRef = React.useRef<HTMLDivElement>(null)

    // Safer callback ref to merge internalRef and forwardedRef
    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        internalRef.current = node

        if (typeof forwardedRef === "function") {
          forwardedRef(node)
        } else if (forwardedRef) {
          ;(
            forwardedRef as React.MutableRefObject<HTMLDivElement | null>
          ).current = node
        }
      },
      [forwardedRef],
    )

    React.useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (
          internalRef.current &&
          !internalRef.current.contains(event.target as Node)
        ) {
          onOpenChange(false)
        }
      }
      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside)
      }
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [isOpen, onOpenChange])

    // Compute alignment classes
    const alignmentClasses =
      align === "end"
        ? "right-0"
        : align === "center"
          ? "left-1/2 -translate-x-1/2"
          : "left-0"

    return (
      <div ref={setRefs} className="relative inline-block w-full text-left">
        <div onClick={() => onOpenChange(!isOpen)} className="cursor-pointer">
          {trigger}
        </div>
        {isOpen && (
          <div
            className={cn(
              "absolute z-50 mt-2 rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-xl shadow-black/50 animate-in fade-in-0 zoom-in-95 duration-200",
              alignmentClasses,
              className,
            )}
            style={{ maxWidth: "100vw" }}
          >
            {content}
          </div>
        )}
      </div>
    )
  },
)

Popover.displayName = "Popover"
