/**
 * Dashboard Page Component
 * Part of the Presentation Layer - Pages
 * Displayed after successful login
 */

import { getCurrentUser, logoutUser } from '@/business/services/auth/authService'
import { Button } from '@/presentation/components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { User } from '@/business/models/auth/types'
import { CheckCircle, LogOut, User as UserIcon } from 'lucide-react'

export function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Get current user on mount
    const currentUser = getCurrentUser()
    if (!currentUser) {
      // If no user, redirect to login
      navigate('/login')
    } else {
      setUser(currentUser)
    }
  }, [navigate])

  const handleLogout = async () => {
    await logoutUser()
    navigate('/login')
  }

  if (!user) {
    return null // Or a loading spinner
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Success Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-white text-center mb-2">
            You're Logged In!
          </h1>

          <p className="text-gray-300 text-center mb-8">
            Welcome to ClassiFi
          </p>

          {/* User Info Card */}
          <div className="bg-white/5 rounded-xl p-6 mb-6 border border-white/10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white mb-3">
                  {user.firstName} {user.lastName}
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Username:</span>
                    <span className="text-white font-medium">{user.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white font-medium">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Role:</span>
                    <span className="text-white font-medium capitalize">{user.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">User ID:</span>
                    <span className="text-white font-mono text-xs">{user.id}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>

          {/* Note */}
          <p className="text-gray-400 text-xs text-center mt-6">
            This is a placeholder dashboard. The main application features will be implemented here.
          </p>
        </div>
      </div>
    </div>
  )
}
