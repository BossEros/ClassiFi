import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

interface BackButtonProps {
    to?: string | number
    label?: string
    className?: string
}

export function BackButton({ to = -1, label = 'Back', className }: BackButtonProps) {
    const navigate = useNavigate()

    const handleBack = () => {
        if (typeof to === 'number') {
            navigate(to as number)
        } else {
            navigate(to as string)
        }
    }

    return (
        <button
            onClick={handleBack}
            className={cn(
                "flex items-center gap-2 text-gray-300 hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-lg -ml-3 transition-colors mb-4 w-fit group cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                className
            )}
        >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
            <span className="text-sm font-medium">{label}</span>
        </button>
    )
}
