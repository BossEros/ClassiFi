import { Monitor } from "lucide-react"

interface DesktopOnlyFeatureNoticeProps {
  title: string
  description: string
}

export function DesktopOnlyFeatureNotice({
  title,
  description,
}: DesktopOnlyFeatureNoticeProps) {
  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
      <div className="flex items-start gap-3">
        <Monitor className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />

        <div>
          <p className="text-sm font-medium text-sky-800">{title}</p>
          <p className="mt-1 text-xs text-sky-600">{description}</p>
        </div>
      </div>
    </div>
  )
}
