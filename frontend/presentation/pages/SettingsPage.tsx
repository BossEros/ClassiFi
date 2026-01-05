import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/presentation/components/dashboard/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/Card'
import { Button } from '@/presentation/components/ui/Button'
import { Avatar } from '@/presentation/components/ui/Avatar'
import { getCurrentUser } from '@/business/services/authService'
// import { useToast } from '@/shared/context/ToastContext'
import type { User } from '@/business/models/auth/types'
import { Settings, User as UserIcon, Lock, Mail, Bell } from 'lucide-react'

export function SettingsPage() {
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        const currentUser = getCurrentUser()
        setUser(currentUser)
    }, [])



    if (!user) return null

    const userInitials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                        <Settings className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                            Settings
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">
                            Manage your account preferences and security
                        </p>
                    </div>
                </div>

                {/* Profile Card */}
                <Card className="border-white/10 bg-slate-900/50 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-purple-400" />
                            Profile Information
                        </CardTitle>
                        <CardDescription>Your personal account details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-6 p-4 rounded-xl bg-white/5 border border-white/5">
                            <Avatar
                                size="lg"
                                fallback={userInitials}
                                className="w-20 h-20 text-xl border-2 border-purple-500/30"
                            />
                            <div>
                                <h3 className="text-xl font-semibold text-white">
                                    {user.firstName} {user.lastName}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium capitalize">
                                        {user.role}
                                    </span>
                                    <span className="text-gray-400 text-sm">{user.username}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">First Name</label>
                                <div className="p-3 rounded-lg bg-black/20 border border-white/10 text-gray-300">
                                    {user.firstName}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Last Name</label>
                                <div className="p-3 rounded-lg bg-black/20 border border-white/10 text-gray-300">
                                    {user.lastName}
                                </div>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    Email Address
                                </label>
                                <div className="p-3 rounded-lg bg-black/20 border border-white/10 text-gray-300">
                                    {user.email}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Security Settings (Placeholder for now) */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border-white/10 bg-slate-900/50 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="w-5 h-5 text-blue-400" />
                                Security
                            </CardTitle>
                            <CardDescription>Password and authentication</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                    <div>
                                        <p className="text-sm font-medium text-white">Password</p>
                                        <p className="text-xs text-gray-400">Last changed recently</p>
                                    </div>
                                    <Button className="w-auto h-8 px-3 text-xs border border-white/10 bg-transparent hover:bg-white/10">
                                        Change
                                    </Button>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                    <div className="opacity-50">
                                        <p className="text-sm font-medium text-white">Two-Factor Auth</p>
                                        <p className="text-xs text-gray-400">Not enabled</p>
                                    </div>
                                    <Button disabled className="w-auto h-8 px-3 text-xs border border-white/10 bg-transparent opacity-50 cursor-not-allowed">
                                        Setup
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-slate-900/50 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="w-5 h-5 text-yellow-400" />
                                Notifications
                            </CardTitle>
                            <CardDescription>Manage your alerts</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                    <div>
                                        <p className="text-sm font-medium text-white">Email Notifications</p>
                                        <p className="text-xs text-gray-400">Receive updates via email</p>
                                    </div>
                                    {/* Placeholder Toggle */}
                                    <div className="w-10 h-6 bg-purple-600 rounded-full relative cursor-pointer">
                                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                    <div className="opacity-50">
                                        <p className="text-sm font-medium text-white">Push Notifications</p>
                                        <p className="text-xs text-gray-400">Coming soon</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
