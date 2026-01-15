import * as React from "react";
import { cn } from "@/shared/utils/cn";

interface PopoverProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  align?: "start" | "end" | "center";
  className?: string;
}

export function Popover({
  trigger,
  content,
  isOpen,
  onOpenChange,
  align = "start",
  className,
}: PopoverProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onOpenChange]);

  return (
    <div ref={ref} className="relative inline-block w-full text-left">
      <div onClick={() => onOpenChange(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-2 rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-xl shadow-black/50 animate-in fade-in-0 zoom-in-95 duration-200",
            align === "end" ? "right-0" : "left-0",
            className
          )}
          style={{ maxWidth: "100vw" }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
