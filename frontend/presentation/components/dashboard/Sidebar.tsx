/**
 * Sidebar Component
 * Part of the Presentation Layer - Dashboard Components
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, Grid3x3, List, Clock, Menu, X, LogOut } from 'lucide-react'
import { NavItem } from './NavItem'
import { Avatar } from '@/presentation/components/ui/Avatar'
import { cn } from '@/shared/utils/cn'
import { logoutUser } from '@/business/services/auth/authService'
import { getCurrentUser } from '@/business/services/auth/authService'
import type { User } from '@/business/models/auth/types'
import { APP_NAME } from '@/shared/constants'

const navigationItems = [
  { id: 'home', label: 'Home', path: '/dashboard', icon: Home },
  { id: 'classes', label: 'Classes', path: '/dashboard/classes', icon: Grid3x3 },
  { id: 'tasks', label: 'All Tasks', path: '/dashboard/tasks', icon: List },
  { id: 'history', label: 'Analysis History', path: '/dashboard/history', icon: Clock }
]

export function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const navigate = useNavigate()

  // Get user on mount
  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
  }, [])

  const handleLogout = async () => {
    await logoutUser()
    navigate('/login')
  }

  const userInitials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : '?'

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-colors shadow-lg"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40',
          'w-64 bg-slate-900/95 backdrop-blur-xl border-r border-white/10',
          'flex flex-col',
          'transform transition-transform duration-300 ease-in-out lg:transform-none',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo/Brand */}
        <div className="h-16 flex items-center px-4 border-b border-white/10">
          <h1 className="text-xl font-bold text-white tracking-tight">{APP_NAME}</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navigationItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              onClick={() => setIsMobileOpen(false)}
            />
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-2 mb-2 px-1.5">
            <Avatar
              size="sm"
              fallback={userInitials}
              alt={user ? `${user.firstName} ${user.lastName}` : 'User'}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {user ? `${user.firstName} ${user.lastName}` : 'User'}
              </p>
              {user && (
                <p className="text-[10px] text-gray-400 truncate leading-tight">
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
}

