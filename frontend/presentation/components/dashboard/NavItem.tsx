/**
 * Navigation Item Component
 * Part of the Presentation Layer - Dashboard Components
 */

import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/utils/cn'
import type { NavigationItem } from '@/business/models/dashboard/types'

interface NavItemProps {
  item: NavigationItem
  onClick?: () => void
}

export function NavItem({ item, onClick }: NavItemProps) {
  const Icon = item.icon

  // Use 'end' prop for the Home route to only match exact path
  const isHomeRoute = item.path === '/dashboard'

  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      end={isHomeRoute}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
          'text-gray-300 hover:text-white hover:bg-white/10 text-sm font-medium',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
          isActive && 'bg-gradient-to-r from-purple-600/20 to-indigo-600/20 text-white border-l-4 border-purple-500 shadow-lg shadow-purple-500/10'
        )
      }
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="font-medium">{item.label}</span>
    </NavLink>
  )
}

