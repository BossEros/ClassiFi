import { FileCode, Calendar, Code, ChevronDown } from 'lucide-react'
import Editor from '@monaco-editor/react'
import { Input } from '@/presentation/components/ui/Input'
import { Textarea } from '@/presentation/components/ui/Textarea'
import { Select } from '@/presentation/components/ui/Select'
import { programmingLanguageOptions, type CourseworkFormData, type FormErrors } from '@/presentation/hooks/useCourseworkForm'
import { formatTimeRemaining } from '@/shared/utils/dateUtils'
import { TestCaseList, type PendingTestCase } from '@/presentation/components/forms/TestCaseList'
import type { TestCase, CreateTestCaseRequest, UpdateTestCaseRequest } from '@/data/repositories/testCaseRepository'

interface BasicInfoFormProps {
    formData: CourseworkFormData
    errors: FormErrors
    isLoading: boolean
    showTemplateCode: boolean
    setShowTemplateCode: (show: boolean) => void
    onInputChange: (field: keyof CourseworkFormData, value: any) => void

    // Test Case Props
    testCases: TestCase[]
    pendingTestCases: PendingTestCase[]
    isLoadingTestCases: boolean
    isEditMode: boolean
    assignmentId?: string
    onAddTestCase: (data: CreateTestCaseRequest) => Promise<void>
    onAddPendingTestCase: (data: PendingTestCase) => void
    onUpdateTestCase: (id: number, data: UpdateTestCaseRequest) => Promise<void>
    onUpdatePendingTestCase: (tempId: string, data: PendingTestCase) => void
    onDeleteTestCase: (id: number) => Promise<void>
    onDeletePendingTestCase: (tempId: string) => void
}

export function BasicInfoForm({
    formData,
    errors,
    isLoading,
    showTemplateCode,
    setShowTemplateCode,
    onInputChange,
    // Test Case props pass-through
    testCases,
    pendingTestCases,
    isLoadingTestCases,
    isEditMode,
    assignmentId,
    onAddTestCase,
    onAddPendingTestCase,
    onUpdateTestCase,
    onUpdatePendingTestCase,
    onDeleteTestCase,
    onDeletePendingTestCase,
}: BasicInfoFormProps) {
    return (
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
                        onChange={e => onInputChange('assignmentName', e.target.value)}
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
                        onChange={e => onInputChange('description', e.target.value)}
                        disabled={isLoading}
                        className={`bg-black/20 border-white/10 text-white placeholder-gray-500 focus:ring-blue-500/40 focus:border-transparent rounded-xl transition-all resize-y min-h-[120px] ${errors.description ? 'border-red-500/50' : 'hover:bg-black/30'}`}
                        rows={5}
                    />
                    {errors.description && (
                        <p className="text-xs text-red-400">{errors.description}</p>
                    )}
                    <p className="text-xs text-gray-500">Minimum 10 characters</p>
                </div>

                {/* Programming Language & Total Score */}
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
                            onChange={(value) => onInputChange('programmingLanguage', value)}
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
                            onChange={(e) => onInputChange('totalScore', parseInt(e.target.value) || 0)}
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
                                    onClick={() => onInputChange('deadline', presetValue)}
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
                                    onInputChange('deadline', `${e.target.value}T${time}`)
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
                                        onInputChange('deadline', `${date}T${e.target.value}`)
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
                                        onInputChange('scheduledDate', now.toISOString().slice(0, 16));
                                    } else {
                                        onInputChange('scheduledDate', null);
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
                                        onInputChange('scheduledDate', `${e.target.value}T${time}`)
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
                                            onInputChange('scheduledDate', `${date}T${e.target.value}`)
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
                                onChange={(value) => onInputChange('templateCode', value || '')}
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
                onAdd={onAddTestCase}
                onAddPending={onAddPendingTestCase}
                onUpdate={onUpdateTestCase}
                onUpdatePending={onUpdatePendingTestCase}
                onDelete={onDeleteTestCase}
                onDeletePending={onDeletePendingTestCase}
            />
        </div>
    )
}
