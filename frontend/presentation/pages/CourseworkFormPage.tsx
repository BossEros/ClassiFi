import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileCode, Calendar, Code, RefreshCw, Check, X, Plus, Edit } from 'lucide-react'
import { DashboardLayout } from '@/presentation/components/dashboard/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/Card'
import { getCurrentUser } from '@/business/services/authService'
import { createAssignment, updateAssignment, getClassById } from '@/business/services/classService'
import { getAssignmentById } from '@/data/repositories/assignmentRepository'
import { Input } from '@/presentation/components/ui/Input'
import { Textarea } from '@/presentation/components/ui/Textarea'
import { Select, type SelectOption } from '@/presentation/components/ui/Select'
import { Button } from '@/presentation/components/ui/Button'
import { useToast } from '@/shared/context/ToastContext'
import {
    validateAssignmentTitle,
    validateDescription,
    validateProgrammingLanguage,
    validateDeadline
} from '@/business/validation/assignmentValidation'
import { formatTimeRemaining } from '@/shared/utils/dateUtils'

interface FormData {
    assignmentName: string
    description: string
    programmingLanguage: 'python' | 'java' | 'c' | ''
    deadline: string
    allowResubmission: boolean
    maxAttempts: number | null
}

interface FormErrors {
    assignmentName?: string
    description?: string
    programmingLanguage?: string
    deadline?: string
    maxAttempts?: string
    general?: string
}

const programmingLanguageOptions: SelectOption[] = [
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'c', label: 'C' }
]

export function CourseworkFormPage() {
    const navigate = useNavigate()
    const { classId, assignmentId } = useParams<{ classId: string; assignmentId?: string }>()
    const { showToast } = useToast()
    const currentUser = getCurrentUser()

    // Determine if we're in edit mode
    const isEditMode = !!assignmentId

    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(isEditMode)
    const [errors, setErrors] = useState<FormErrors>({})
    const [className, setClassName] = useState('')

    const [formData, setFormData] = useState<FormData>({
        assignmentName: '',
        description: '',
        programmingLanguage: '',
        deadline: '',
        allowResubmission: true,
        maxAttempts: null,
    })

    // Fetch class name and existing assignment data when in edit mode
    useEffect(() => {
        const fetchData = async () => {
            const user = getCurrentUser()
            if (!user || !classId) return

            setIsFetching(true)
            try {
                // Fetch class name
                const classData = await getClassById(parseInt(classId), parseInt(user.id))
                setClassName(classData.className)

                // If editing, fetch assignment data
                if (isEditMode && assignmentId) {
                    const response = await getAssignmentById(parseInt(assignmentId), parseInt(user.id))
                    if (response.data?.assignment) {
                        const assignment = response.data.assignment
                        const deadline = new Date(assignment.deadline)
                        deadline.setMinutes(deadline.getMinutes() - deadline.getTimezoneOffset())

                        setFormData({
                            assignmentName: assignment.assignmentName,
                            description: assignment.description,
                            programmingLanguage: assignment.programmingLanguage as 'python' | 'java' | 'c',
                            deadline: deadline.toISOString().slice(0, 16),
                            allowResubmission: assignment.allowResubmission,
                            maxAttempts: (assignment as any).maxAttempts ?? null,
                        })
                    }
                }
            } catch (error) {
                setErrors({ general: 'Failed to load data. Please try again.' })
            } finally {
                setIsFetching(false)
            }
        }
        fetchData()
    }, [classId, isEditMode, assignmentId])

    const handleInputChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        setErrors(prev => ({ ...prev, [field]: undefined, general: undefined }))
    }

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {}

        const nameError = validateAssignmentTitle(formData.assignmentName)
        if (nameError) newErrors.assignmentName = nameError

        const descError = validateDescription(formData.description)
        if (descError) newErrors.description = descError

        const langError = validateProgrammingLanguage(formData.programmingLanguage)
        if (langError) newErrors.programmingLanguage = langError

        if (!formData.deadline) {
            newErrors.deadline = 'Deadline is required'
        } else {
            const deadlineError = validateDeadline(new Date(formData.deadline))
            if (deadlineError) newErrors.deadline = deadlineError
        }

        if (formData.allowResubmission && formData.maxAttempts !== null) {
            if (formData.maxAttempts < 1 || formData.maxAttempts > 99) {
                newErrors.maxAttempts = 'Max attempts must be between 1 and 99'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        if (!currentUser?.id || !classId) {
            setErrors({ general: 'You must be logged in' })
            return
        }

        setIsLoading(true)

        try {
            if (isEditMode && assignmentId) {
                // Update existing assignment
                await updateAssignment(parseInt(assignmentId), {
                    teacherId: parseInt(currentUser.id),
                    assignmentName: formData.assignmentName.trim(),
                    description: formData.description.trim(),
                    programmingLanguage: formData.programmingLanguage as 'python' | 'java' | 'c',
                    deadline: new Date(formData.deadline),
                    allowResubmission: formData.allowResubmission,
                    maxAttempts: formData.allowResubmission ? formData.maxAttempts : 1,
                })
                showToast('Coursework updated successfully')
            } else {
                // Create new assignment
                await createAssignment({
                    classId: parseInt(classId),
                    teacherId: parseInt(currentUser.id),
                    assignmentName: formData.assignmentName.trim(),
                    description: formData.description.trim(),
                    programmingLanguage: formData.programmingLanguage as 'python' | 'java' | 'c',
                    deadline: new Date(formData.deadline),
                    allowResubmission: formData.allowResubmission,
                    maxAttempts: formData.allowResubmission ? formData.maxAttempts : 1,
                })
                showToast('Coursework created successfully')
            }
            navigate(`/dashboard/classes/${classId}`)
        } catch {
            setErrors({ general: `Failed to ${isEditMode ? 'update' : 'create'} coursework. Please try again.` })
        } finally {
            setIsLoading(false)
        }
    }

    // Show loading state while fetching data
    if (isFetching) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading coursework data...</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                            {isEditMode ? (
                                <Edit className="w-5 h-5 text-purple-300" />
                            ) : (
                                <Plus className="w-5 h-5 text-purple-300" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">
                                {isEditMode ? 'Edit Coursework' : 'Create Coursework'}
                            </h1>
                            {className && (
                                <p className="text-sm text-gray-400 mt-0.5">
                                    {className}
                                </p>
                            )}
                        </div>
                    </div>
                    <Button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="w-auto px-4 bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mt-4"></div>
            </div>

            {/* Error Banner */}
            {errors.general && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400">{errors.general}</p>
                </div>
            )}

            {/* Form Content */}
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Basic Information */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information Card */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-purple-500/20">
                                        <FileCode className="w-5 h-5 text-purple-300" />
                                    </div>
                                    <div>
                                        <CardTitle>Basic Information</CardTitle>
                                        <CardDescription className="mt-1">Enter the coursework details</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                {/* Coursework Title */}
                                <div className="space-y-2">
                                    <label htmlFor="assignmentName" className="text-sm font-medium text-white">
                                        Coursework Title <span className="text-red-400">*</span>
                                    </label>
                                    <Input
                                        id="assignmentName"
                                        type="text"
                                        placeholder="e.g., Fibonacci Sequence"
                                        value={formData.assignmentName}
                                        onChange={e => handleInputChange('assignmentName', e.target.value)}
                                        disabled={isLoading}
                                        className={errors.assignmentName ? 'border-red-500/50' : ''}
                                        maxLength={150}
                                    />
                                    {errors.assignmentName && (
                                        <p className="text-xs text-red-400">{errors.assignmentName}</p>
                                    )}
                                    <p className="text-xs text-gray-500">
                                        {formData.assignmentName.length}/150 characters
                                    </p>
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <label htmlFor="description" className="text-sm font-medium text-white">
                                        Description <span className="text-red-400">*</span>
                                    </label>
                                    <Textarea
                                        id="description"
                                        placeholder="Describe what students need to do..."
                                        value={formData.description}
                                        onChange={e => handleInputChange('description', e.target.value)}
                                        disabled={isLoading}
                                        className={errors.description ? 'border-red-500/50' : ''}
                                        rows={4}
                                    />
                                    {errors.description && (
                                        <p className="text-xs text-red-400">{errors.description}</p>
                                    )}
                                    <p className="text-xs text-gray-500">Minimum 10 characters</p>
                                </div>

                                {/* Programming Language & Deadline */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Programming Language */}
                                    <div className="space-y-2">
                                        <label htmlFor="programmingLanguage" className="text-sm font-medium text-white flex items-center gap-2">
                                            <Code className="w-4 h-4" />
                                            Programming Language <span className="text-red-400">*</span>
                                        </label>
                                        <Select
                                            id="programmingLanguage"
                                            options={programmingLanguageOptions}
                                            value={formData.programmingLanguage}
                                            onChange={(value) => handleInputChange('programmingLanguage', value)}
                                            disabled={isLoading}
                                            className={errors.programmingLanguage ? 'border-red-500/50' : ''}
                                            placeholder="Select language"
                                        />
                                        {errors.programmingLanguage && (
                                            <p className="text-xs text-red-400">{errors.programmingLanguage}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Deadline - Full Width Section */}
                                <div className="space-y-3 pt-2">
                                    <label className="text-sm font-medium text-white flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Deadline <span className="text-red-400">*</span>
                                    </label>

                                    {/* Quick Preset Buttons */}
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { label: 'Tomorrow', days: 1 },
                                            { label: 'In 3 days', days: 3 },
                                            { label: 'In 1 week', days: 7 },
                                            { label: 'In 2 weeks', days: 14 },
                                            { label: 'In 1 month', days: 30 },
                                        ].map((preset) => {
                                            const presetDate = new Date()
                                            presetDate.setDate(presetDate.getDate() + preset.days)
                                            presetDate.setHours(23, 59, 0, 0)
                                            const presetValue = presetDate.toISOString().slice(0, 16)
                                            const isSelected = formData.deadline === presetValue

                                            return (
                                                <button
                                                    key={preset.days}
                                                    type="button"
                                                    onClick={() => handleInputChange('deadline', presetValue)}
                                                    disabled={isLoading}
                                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${isSelected
                                                        ? 'bg-purple-500/30 border-purple-500/50 text-purple-300'
                                                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20 hover:text-white'
                                                        }`}
                                                >
                                                    {preset.label}
                                                </button>
                                            )
                                        })}
                                    </div>

                                    {/* Custom Date/Time Inputs */}
                                    <div className="flex items-end gap-4 pt-1">
                                        <div className="space-y-1">
                                            <label htmlFor="deadline-date" className="text-xs text-gray-400">
                                                📅 Date
                                            </label>
                                            <Input
                                                id="deadline-date"
                                                type="date"
                                                aria-label="Deadline date"
                                                value={formData.deadline.split('T')[0] || ''}
                                                onChange={e => {
                                                    const time = formData.deadline.split('T')[1] || '23:59'
                                                    handleInputChange('deadline', `${e.target.value}T${time}`)
                                                }}
                                                disabled={isLoading}
                                                className={`h-10 w-auto ${errors.deadline ? 'border-red-500/50' : ''}`}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label htmlFor="deadline-time" className="text-xs text-gray-400">
                                                ⏰ Time
                                            </label>
                                            <Input
                                                id="deadline-time"
                                                type="time"
                                                aria-label="Deadline time"
                                                value={formData.deadline.split('T')[1] || ''}
                                                onChange={e => {
                                                    const date = formData.deadline.split('T')[0] || ''
                                                    if (date) {
                                                        handleInputChange('deadline', `${date}T${e.target.value}`)
                                                    }
                                                }}
                                                disabled={isLoading || !formData.deadline.split('T')[0]}
                                                className={`h-10 w-auto ${errors.deadline ? 'border-red-500/50' : ''}`}
                                            />
                                        </div>
                                    </div>

                                    {/* Deadline Preview */}
                                    {formData.deadline && (
                                        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-purple-300 font-medium">Selected Deadline</p>
                                                    <p className="text-sm text-white mt-0.5">
                                                        {new Date(formData.deadline).toLocaleString('en-US', {
                                                            weekday: 'long',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                            hour: 'numeric',
                                                            minute: '2-digit',
                                                            hour12: true
                                                        })}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-purple-300">Time remaining</p>
                                                    <p className="text-sm font-medium text-white">
                                                        {formatTimeRemaining(formData.deadline)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {errors.deadline && (
                                        <p className="text-xs text-red-400">{errors.deadline}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Submission Settings & Actions */}
                    <div className="space-y-6">
                        {/* Submission Settings Card */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-green-500/20">
                                        <RefreshCw className="w-5 h-5 text-green-300" />
                                    </div>
                                    <div>
                                        <CardTitle>Submission Settings</CardTitle>
                                        <CardDescription className="mt-1">Configure resubmission options</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                {/* Allow Resubmission */}
                                <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
                                    <input
                                        id="allowResubmission"
                                        type="checkbox"
                                        checked={formData.allowResubmission}
                                        onChange={(e) => handleInputChange('allowResubmission', e.target.checked)}
                                        disabled={isLoading}
                                        className="w-5 h-5 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-2 focus:ring-purple-500/50 cursor-pointer"
                                    />
                                    <label htmlFor="allowResubmission" className="text-sm text-gray-300 cursor-pointer">
                                        Allow students to resubmit
                                    </label>
                                </div>

                                {/* Max Attempts - Only shown when resubmission is allowed */}
                                {formData.allowResubmission && (
                                    <div className="space-y-2">
                                        <label htmlFor="maxAttempts" className="text-sm font-medium text-white">
                                            Max Attempts
                                        </label>
                                        <Input
                                            id="maxAttempts"
                                            type="number"
                                            placeholder="Leave empty for unlimited"
                                            value={formData.maxAttempts ?? ''}
                                            onChange={e => {
                                                const value = e.target.value
                                                handleInputChange('maxAttempts', value === '' ? null : parseInt(value, 10))
                                            }}
                                            disabled={isLoading}
                                            className={errors.maxAttempts ? 'border-red-500/50' : ''}
                                            min={1}
                                            max={99}
                                        />
                                        {errors.maxAttempts && (
                                            <p className="text-xs text-red-400">{errors.maxAttempts}</p>
                                        )}
                                        <p className="text-xs text-gray-500">
                                            Leave empty for unlimited attempts
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Action Buttons Card */}
                        <Card>
                            <CardContent className="p-6 space-y-3">
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full"
                                >
                                    {isLoading ? (
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Check className="w-4 h-4 mr-2" />
                                    )}
                                    {isEditMode ? 'Save Changes' : 'Create Coursework'}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    disabled={isLoading}
                                    className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </DashboardLayout>
    )
}

export default CourseworkFormPage
