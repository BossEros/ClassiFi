import { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, Eye, EyeOff, Clock } from 'lucide-react';
import { Button } from '@/presentation/components/ui/Button';
import { Input } from '@/presentation/components/ui/Input';
import { Textarea } from '@/presentation/components/ui/Textarea';
import type { TestCase, CreateTestCaseRequest, UpdateTestCaseRequest } from '@/data/repositories/testCaseRepository';

interface TestCaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateTestCaseRequest | UpdateTestCaseRequest) => Promise<void>;
    testCase?: TestCase | null;
    isLoading?: boolean;
}

export function TestCaseModal({
    isOpen,
    onClose,
    onSave,
    testCase,
    isLoading = false,
}: TestCaseModalProps) {
    const isEditMode = !!testCase;

    const [formData, setFormData] = useState({
        name: '',
        input: '',
        expectedOutput: '',
        isHidden: false,
        timeLimit: 5,
    });

    const [errors, setErrors] = useState<{ name?: string; expectedOutput?: string }>({});

    // Reset form when modal opens/closes or testCase changes
    useEffect(() => {
        if (isOpen && testCase) {
            setFormData({
                name: testCase.name,
                input: testCase.input,
                expectedOutput: testCase.expectedOutput,
                isHidden: testCase.isHidden,
                timeLimit: testCase.timeLimit,
            });
        } else if (isOpen && !testCase) {
            setFormData({
                name: '',
                input: '',
                expectedOutput: '',
                isHidden: false,
                timeLimit: 5,
            });
        }
        setErrors({});
    }, [isOpen, testCase]);

    const handleChange = (field: keyof typeof formData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: undefined }));
    };

    const validate = (): boolean => {
        const newErrors: typeof errors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Test case name is required';
        } else if (formData.name.length > 100) {
            newErrors.name = 'Name must be 100 characters or less';
        }

        if (!formData.expectedOutput.trim()) {
            newErrors.expectedOutput = 'Expected output is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        await onSave({
            name: formData.name.trim(),
            input: formData.input,
            expectedOutput: formData.expectedOutput,
            isHidden: formData.isHidden,
            timeLimit: formData.timeLimit,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl mx-4 bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-xl font-semibold text-white">
                            {isEditMode ? 'Edit Test Case' : 'Add Test Case'}
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            Define input and expected output for automated testing
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Test Case Name */}
                    <div className="space-y-2">
                        <label htmlFor="tcName" className="text-sm font-medium text-white">
                            Name <span className="text-red-400">*</span>
                        </label>
                        <Input
                            id="tcName"
                            placeholder="e.g., Basic Addition Test"
                            value={formData.name}
                            onChange={e => handleChange('name', e.target.value)}
                            disabled={isLoading}
                            maxLength={100}
                            className={errors.name ? 'border-red-500/50' : ''}
                        />
                        {errors.name && (
                            <p className="text-xs text-red-400">{errors.name}</p>
                        )}
                    </div>

                    {/* Input (stdin) */}
                    <div className="space-y-2">
                        <label htmlFor="tcInput" className="text-sm font-medium text-white">
                            Input (stdin)
                        </label>
                        <Textarea
                            id="tcInput"
                            placeholder="Enter input that will be passed to the program..."
                            value={formData.input}
                            onChange={e => handleChange('input', e.target.value)}
                            disabled={isLoading}
                            rows={3}
                            className="font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500">
                            Leave empty if no input is needed
                        </p>
                    </div>

                    {/* Expected Output */}
                    <div className="space-y-2">
                        <label htmlFor="tcOutput" className="text-sm font-medium text-white">
                            Expected Output <span className="text-red-400">*</span>
                        </label>
                        <Textarea
                            id="tcOutput"
                            placeholder="Enter the exact expected output..."
                            value={formData.expectedOutput}
                            onChange={e => handleChange('expectedOutput', e.target.value)}
                            disabled={isLoading}
                            rows={3}
                            className={`font-mono text-sm ${errors.expectedOutput ? 'border-red-500/50' : ''}`}
                        />
                        {errors.expectedOutput && (
                            <p className="text-xs text-red-400">{errors.expectedOutput}</p>
                        )}
                    </div>

                    {/* Settings Row */}
                    <div className="flex flex-wrap gap-4 pt-2">
                        {/* Time Limit */}
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <label htmlFor="tcTimeLimit" className="text-sm text-gray-300">
                                Time Limit
                            </label>
                            <select
                                id="tcTimeLimit"
                                value={formData.timeLimit}
                                onChange={e => handleChange('timeLimit', parseInt(e.target.value))}
                                disabled={isLoading}
                                className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            >
                                {[1, 2, 3, 5, 10].map(sec => (
                                    <option key={sec} value={sec}>{sec}s</option>
                                ))}
                            </select>
                        </div>

                        {/* Hidden from Students */}
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                            {formData.isHidden ? (
                                <EyeOff className="w-4 h-4 text-amber-400" />
                            ) : (
                                <Eye className="w-4 h-4 text-gray-400" />
                            )}
                            <label htmlFor="tcHidden" className="text-sm text-gray-300 cursor-pointer">
                                Hidden from students
                            </label>
                            <input
                                id="tcHidden"
                                type="checkbox"
                                checked={formData.isHidden}
                                onChange={e => handleChange('isHidden', e.target.checked)}
                                disabled={isLoading}
                                className="w-5 h-5 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-2 focus:ring-purple-500/50 cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Hidden Warning */}
                    {formData.isHidden && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-200">
                                Hidden test cases only show pass/fail status to students without revealing the input or expected output.
                            </p>
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-white/10">
                    <Button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        {isEditMode ? 'Update' : 'Add'} Test Case
                    </Button>
                </div>
            </div>
        </div>
    );
}
