import * as React from 'react'
import { cn } from '@/shared/utils/cn'
import { MoreVertical } from 'lucide-react'

interface DropdownMenuItem {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  variant?: 'default' | 'danger'
  onClick: () => void
}

interface DropdownMenuProps {
  items: DropdownMenuItem[]
  className?: string
  triggerLabel?: string
}

export function DropdownMenu({ items, className, triggerLabel = 'More options' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close menu on escape key
  React.useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <div ref={menuRef} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'p-2 rounded-lg transition-colors duration-200',
          'hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
          isOpen && 'bg-white/10'
        )}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={triggerLabel}
        title={triggerLabel}
        type="button"
      >
        <MoreVertical className="w-5 h-5 text-gray-400" />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute right-0 top-full mt-2 z-50',
            'min-w-[160px] py-1',
            'rounded-lg border border-white/10 bg-slate-900/95 backdrop-blur-sm',
            'shadow-lg shadow-black/20',
            'animate-in fade-in-0 zoom-in-95 duration-150'
          )}
          role="menu"
        >
          {items.map((item) => {
            const Icon = item.icon

            return (
              <button
                key={item.id}
                onClick={() => {
                  item.onClick()
                  setIsOpen(false)
                }}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-2 text-sm text-left',
                  'transition-colors duration-150',
                  item.variant === 'danger'
                    ? 'text-red-400 hover:bg-red-500/10'
                    : 'text-gray-300 hover:bg-white/10'
                )}
                role="menuitem"
              >
                {Icon && <Icon className="w-4 h-4" />}
                {item.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
