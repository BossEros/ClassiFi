import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { FileCode, Calendar, Code, RefreshCw, Check, X, ChevronDown } from 'lucide-react'
import { DashboardLayout } from '@/presentation/components/dashboard/DashboardLayout'
import { getCurrentUser } from '@/business/services/authService'
import { createAssignment, updateAssignment, getClassById } from '@/business/services/classService'
import { getAssignmentById } from '@/data/repositories/assignmentRepository'
import { Input } from '@/presentation/components/ui/Input'
import { Textarea } from '@/presentation/components/ui/Textarea'
import { Select, type SelectOption } from '@/presentation/components/ui/Select'
import { Button } from '@/presentation/components/ui/Button'
import { BackButton } from '@/presentation/components/ui/BackButton'
import { useToast } from '@/shared/context/ToastContext'
import {
    validateAssignmentTitle,
    validateDescription,
    validateProgrammingLanguage,
    validateDeadline
} from '@/business/validation/assignmentValidation'
import { formatTimeRemaining } from '@/shared/utils/dateUtils'
import { TestCaseList, type PendingTestCase } from '@/presentation/components/forms/TestCaseList'
import {
    getTestCases,
    createTestCase,
    updateTestCase,
    deleteTestCase,
    type TestCase,
    type CreateTestCaseRequest,
    type UpdateTestCaseRequest,
} from '@/data/repositories/testCaseRepository'

interface FormData {
    assignmentName: string
    description: string
    programmingLanguage: 'python' | 'java' | 'c' | ''
    deadline: string
    allowResubmission: boolean
    maxAttempts: number | null
    templateCode: string
    totalScore: number
    scheduledDate: string | null
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
    const [showTemplateCode, setShowTemplateCode] = useState(false)
    const [testCases, setTestCases] = useState<TestCase[]>([])
    const [pendingTestCases, setPendingTestCases] = useState<PendingTestCase[]>([])
    const [isLoadingTestCases, setIsLoadingTestCases] = useState(false)

    const [formData, setFormData] = useState<FormData>({
        assignmentName: '',
        description: '',
        programmingLanguage: '',
        deadline: '',
        allowResubmission: true,
        maxAttempts: null,
        templateCode: '',
        totalScore: 100,
        scheduledDate: null,
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
                            templateCode: (assignment as any).templateCode ?? '',
                            totalScore: (assignment as any).totalScore ?? 100,
                            scheduledDate: (assignment as any).scheduledDate ? new Date((assignment as any).scheduledDate).toISOString().slice(0, 16) : null,
                        })
                        setShowTemplateCode(!!(assignment as any).templateCode)
                    }
                }
            } catch (_error) {
                setErrors({ general: 'Failed to load data. Please try again.' })
            } finally {
                setIsFetching(false)
            }
        }
        fetchData()
    }, [classId, isEditMode, assignmentId])

    // Fetch test cases when in edit mode
    useEffect(() => {
        const fetchTestCases = async () => {
            if (!isEditMode || !assignmentId) return
            setIsLoadingTestCases(true)
            try {
                const response = await getTestCases(parseInt(assignmentId))
                if (response.data?.testCases) {
                    setTestCases(response.data.testCases)
                }
            } catch (error) {
                console.error('Failed to load test cases:', error)
            } finally {
                setIsLoadingTestCases(false)
            }
        }
        fetchTestCases()
    }, [isEditMode, assignmentId])

    // Test case handlers
    const handleAddTestCase = async (data: CreateTestCaseRequest) => {
        if (!assignmentId) return
        const response = await createTestCase(parseInt(assignmentId), data)
        if (response.data?.testCase) {
            setTestCases(prev => [...prev, response.data!.testCase])
            showToast('Test case added')
        }
    }

    const handleUpdateTestCase = async (id: number, data: UpdateTestCaseRequest) => {
        const response = await updateTestCase(id, data)
        if (response.data?.testCase) {
            setTestCases(prev => prev.map(tc => tc.id === id ? response.data!.testCase : tc))
            showToast('Test case updated')
        }
    }

    const handleDeleteTestCase = async (id: number) => {
        await deleteTestCase(id)
        setTestCases(prev => prev.filter(tc => tc.id !== id))
        showToast('Test case deleted')
    }

    // Pending test case handlers (for create mode)
    const handleAddPendingTestCase = (data: PendingTestCase) => {
        setPendingTestCases(prev => [...prev, data])
    }

    const handleUpdatePendingTestCase = (tempId: string, data: PendingTestCase) => {
        setPendingTestCases(prev => prev.map(tc => tc.tempId === tempId ? data : tc))
    }

    const handleDeletePendingTestCase = (tempId: string) => {
        setPendingTestCases(prev => prev.filter(tc => tc.tempId !== tempId))
    }

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
                    templateCode: formData.templateCode || null,
                    totalScore: formData.totalScore,
                    scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate) : null,
                })
                showToast('Coursework updated successfully')
            } else {
                // Create new assignment
                const newAssignment = await createAssignment({
                    classId: parseInt(classId),
                    teacherId: parseInt(currentUser.id),
                    assignmentName: formData.assignmentName.trim(),
                    description: formData.description.trim(),
                    programmingLanguage: formData.programmingLanguage as 'python' | 'java' | 'c',
                    deadline: new Date(formData.deadline),
                    allowResubmission: formData.allowResubmission,
                    maxAttempts: formData.allowResubmission ? formData.maxAttempts : 1,
                    templateCode: formData.templateCode || null,
                    totalScore: formData.totalScore,
                    scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate) : null,
                })

                // Create pending test cases if any
                if (pendingTestCases.length > 0 && newAssignment?.id) {
                    for (const pending of pendingTestCases) {
                        await createTestCase(newAssignment.id, {
                            name: pending.name,
                            input: pending.input,
                            expectedOutput: pending.expectedOutput,
                            isHidden: pending.isHidden,
                            timeLimit: pending.timeLimit,
                            sortOrder: pending.sortOrder,
                        })
                    }
                    showToast(`Coursework created with ${pendingTestCases.length} test case(s)`)
                } else {
                    showToast('Coursework created successfully')
                }
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
                <BackButton />
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">
                                {isEditMode ? 'Edit Coursework' : 'Create Coursework for'}
                                {className && <span className="text-purple-400"> {className}</span>}
                            </h1>
                        </div>
                    </div>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mt-4"></div>
            </div>

            {/* Error Banner */}
            {errors.general && (
                <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                    <div className="p-2 rounded-full bg-red-500/20">
                        <X className="w-4 h-4 text-red-400" />
                    </div>
                    <p className="text-sm text-red-400 font-medium">{errors.general}</p>
                </div>
            )}

            {/* Form Content */}
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Basic Information */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information Card */}
                        {/* Basic Information Card */}
                        <div className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md overflow-hidden p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                    <FileCode className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Basic Information</h2>
                                    <p className="text-sm text-gray-400">Enter the coursework details below</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Coursework Title */}
                                <div className="space-y-2">
                                    <label htmlFor="assignmentName" className="text-sm font-medium text-gray-300">
                                        Coursework Title <span className="text-red-400">*</span>
                                    </label>
                                    <Input
                                        id="assignmentName"
                                        type="text"
                                        placeholder="e.g., Fibonacci Sequence Implementation"
                                        value={formData.assignmentName}
                                        onChange={e => handleInputChange('assignmentName', e.target.value)}
                                        disabled={isLoading}
                                        className={`bg-black/20 border-white/10 text-white placeholder-gray-500 focus:ring-blue-500/40 focus:border-transparent rounded-xl h-11 transition-all ${errors.assignmentName ? 'border-red-500/50' : 'hover:bg-black/30'}`}
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
                                    <label htmlFor="description" className="text-sm font-medium text-gray-300">
                                        Description <span className="text-red-400">*</span>
                                    </label>
                                    <Textarea
                                        id="description"
                                        placeholder="Provide detailed instructions for your students..."
                                        value={formData.description}
                                        onChange={e => handleInputChange('description', e.target.value)}
                                        disabled={isLoading}
                                        className={`bg-black/20 border-white/10 text-white placeholder-gray-500 focus:ring-blue-500/40 focus:border-transparent rounded-xl transition-all resize-y min-h-[120px] ${errors.description ? 'border-red-500/50' : 'hover:bg-black/30'}`}
                                        rows={5}
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
                                        <label htmlFor="programmingLanguage" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                            <Code className="w-4 h-4 text-blue-400" />
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

                                    {/* Total Score */}
                                    <div className="space-y-2">
                                        <label htmlFor="totalScore" className="text-sm font-medium text-gray-300">
                                            Total Score <span className="text-red-400">*</span>
                                        </label>
                                        <Input
                                            id="totalScore"
                                            type="number"
                                            value={formData.totalScore}
                                            onChange={(e) => handleInputChange('totalScore', parseInt(e.target.value) || 0)}
                                            placeholder="100"
                                            min="1"
                                            disabled={isLoading}
                                            className="h-11 bg-black/20 border-white/10 text-white focus:ring-blue-500/40 rounded-xl hover:bg-black/30 w-full"
                                        />
                                    </div>
                                </div>

                                {/* Deadline - Full Width Section */}
                                <div className="space-y-3 pt-4">
                                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-orange-400" />
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
                                                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200 ${isSelected
                                                        ? 'bg-orange-500/10 border-orange-500/20 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.1)]'
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
                                                className={`h-11 w-auto bg-black/20 border-white/10 text-white focus:ring-orange-500/40 rounded-xl ${errors.deadline ? 'border-red-500/50' : 'hover:bg-black/30'}`}
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
                                                className={`h-11 w-auto bg-black/20 border-white/10 text-white focus:ring-orange-500/40 rounded-xl ${errors.deadline ? 'border-red-500/50' : 'hover:bg-black/30'}`}
                                            />
                                        </div>
                                    </div>

                                </div>

                                {/* Scheduled Release */}
                                <div className="space-y-3 pt-4 border-t border-white/10">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-purple-400" />
                                            Scheduled Release
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={!!formData.scheduledDate}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        const now = new Date();
                                                        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                                                        handleInputChange('scheduledDate', now.toISOString().slice(0, 16));
                                                    } else {
                                                        handleInputChange('scheduledDate', null);
                                                    }
                                                }}
                                                className="rounded border-white/10 bg-black/20 text-purple-600 focus:ring-purple-500/40"
                                            />
                                            <span className="text-xs text-gray-400">Schedule for later</span>
                                        </div>
                                    </div>

                                    {formData.scheduledDate && (
                                        <div className="flex items-end gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="space-y-1">
                                                <label htmlFor="scheduled-date" className="text-xs text-gray-400">
                                                    📅 Date
                                                </label>
                                                <Input
                                                    id="scheduled-date"
                                                    type="date"
                                                    value={formData.scheduledDate.split('T')[0] || ''}
                                                    onChange={e => {
                                                        const time = formData.scheduledDate?.split('T')[1] || '00:00'
                                                        handleInputChange('scheduledDate', `${e.target.value}T${time}`)
                                                    }}
                                                    className="h-11 w-auto bg-black/20 border-white/10 text-white focus:ring-purple-500/40 rounded-xl hover:bg-black/30"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label htmlFor="scheduled-time" className="text-xs text-gray-400">
                                                    ⏰ Time
                                                </label>
                                                <Input
                                                    id="scheduled-time"
                                                    type="time"
                                                    value={formData.scheduledDate.split('T')[1] || ''}
                                                    onChange={e => {
                                                        const date = formData.scheduledDate?.split('T')[0] || ''
                                                        if (date) {
                                                            handleInputChange('scheduledDate', `${date}T${e.target.value}`)
                                                        }
                                                    }}
                                                    className="h-11 w-auto bg-black/20 border-white/10 text-white focus:ring-purple-500/40 rounded-xl hover:bg-black/30"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Deadline Preview */}
                                {formData.deadline && (
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/10">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-orange-400 font-medium uppercase tracking-wider mb-1">Selected Deadline</p>
                                                <p className="text-sm text-white font-medium">
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
                                                <p className="text-xs text-orange-400 font-medium uppercase tracking-wider mb-1">Time remaining</p>
                                                <p className="text-sm font-medium text-white font-mono">
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

                            {/* Template Code (Optional) */}
                            <div className="space-y-3 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setShowTemplateCode(!showTemplateCode)}
                                    className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                                >
                                    <Code className="w-4 h-4" />
                                    Template Code (Optional)
                                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showTemplateCode ? 'rotate-180' : ''}`} />
                                </button>

                                {showTemplateCode && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <p className="text-xs text-gray-500">
                                            Provide starter/template code that will be excluded from similarity analysis.
                                            Students won't be flagged for using this code.
                                        </p>
                                        <div className="rounded-xl overflow-hidden border border-white/10">
                                            <Editor
                                                height="300px"
                                                theme="vs-dark"
                                                language={formData.programmingLanguage || 'plaintext'}
                                                value={formData.templateCode}
                                                onChange={(value) => handleInputChange('templateCode', value || '')}
                                                options={{
                                                    minimap: { enabled: false },
                                                    fontSize: 14,
                                                    lineNumbers: 'on',
                                                    scrollBeyondLastLine: false,
                                                    automaticLayout: true,
                                                    padding: { top: 16, bottom: 16 },
                                                    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                                                    formatOnPaste: true,
                                                    formatOnType: true,
                                                }}
                                            />
                                        </div>
                                        {formData.templateCode && (
                                            <div className="flex justify-end px-2">
                                                <p className="text-xs text-gray-500">
                                                    {formData.templateCode.split('\n').length} lines • {formData.templateCode.length} characters
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Test Cases Section */}
                            <TestCaseList
                                testCases={testCases}
                                pendingTestCases={pendingTestCases}
                                isLoading={isLoadingTestCases}
                                isEditMode={isEditMode}
                                assignmentId={assignmentId ? parseInt(assignmentId) : undefined}
                                onAdd={handleAddTestCase}
                                onAddPending={handleAddPendingTestCase}
                                onUpdate={handleUpdateTestCase}
                                onUpdatePending={handleUpdatePendingTestCase}
                                onDelete={handleDeleteTestCase}
                                onDeletePending={handleDeletePendingTestCase}
                            />
                        </div>
                    </div>

                    {/* Right Column - Submission Settings & Actions */}
                    <div className="space-y-6">
                        {/* Submission Settings Card */}
                        <div className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md overflow-hidden p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                    <RefreshCw className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Submission Settings</h2>
                                    <p className="text-sm text-gray-400">Configure resubmission options</p>
                                </div>
                            </div>
                            <div className="space-y-5">
                                {/* Allow Resubmission */}
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-all cursor-pointer" onClick={() => handleInputChange('allowResubmission', !formData.allowResubmission)}>
                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${formData.allowResubmission ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 bg-white/5'}`}>
                                        {formData.allowResubmission && <Check className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <label className="text-sm text-gray-300 cursor-pointer select-none">
                                        Allow students to resubmit
                                    </label>
                                </div>

                                {/* Max Attempts - Only shown when resubmission is allowed */}
                                {formData.allowResubmission && (
                                    <div className="space-y-2">
                                        <label htmlFor="maxAttempts" className="text-sm font-medium text-gray-300">
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
                                            className={`bg-black/20 border-white/10 text-white placeholder-gray-500 focus:ring-emerald-500/40 focus:border-transparent rounded-xl h-11 ${errors.maxAttempts ? 'border-red-500/50' : 'hover:bg-black/30'}`}
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
                            </div>
                        </div>

                        {/* Action Buttons Card */}
                        <div className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md overflow-hidden p-6">
                            <div className="space-y-3">
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
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
                                    className="w-full h-11 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 rounded-xl transition-all"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </DashboardLayout >
    )
}

export default CourseworkFormPage
