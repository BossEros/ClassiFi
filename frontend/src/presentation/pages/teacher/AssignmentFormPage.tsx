import { useNavigate } from "react-router-dom"
import { RefreshCw, Check, X } from "lucide-react"
import { useEffect, useState } from "react"
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout"
import { Card, CardContent } from "@/presentation/components/ui/Card"
import { Button } from "@/presentation/components/ui/Button"
import { Select } from "@/presentation/components/ui/Select"
import { useAssignmentForm } from "@/presentation/hooks/teacher/useAssignmentForm"
import { BasicInfoForm } from "@/presentation/components/teacher/forms/assignment/BasicInfoForm"
import { SubmissionSettings } from "@/presentation/components/teacher/forms/assignment/SubmissionSettings"
import { LatePenaltyConfig } from "@/presentation/components/teacher/forms/assignment/LatePenaltyConfig"
import type { LatePenaltyConfig as LatePenaltyConfigType } from "@/data/api/gradebook.types"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar"
import { FormProvider } from "react-hook-form"
import { dashboardTheme } from "@/presentation/constants/dashboardTheme"
import { assignmentFormTheme } from "@/presentation/constants/assignmentFormTheme"
import { getModulesByClassId } from "@/business/services/moduleService"
import type { Module } from "@/data/api/class.types"

export function AssignmentFormPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.user)
  const {
    formMethods,
    // State
    formData,
    errors,
    isLoading,
    isFetching,
    className,
    classId,
    testCases,
    pendingTestCases,
    isLoadingTestCases,
    isUploadingInstructionsImage,
    isEditMode,
    assignmentId,
    showTemplateCode,

    // Actions
    setShowTemplateCode,
    handleInputChange,
    handleInstructionsImageUpload,
    handleRemoveInstructionsImage,
    handleSubmit,

    // Test Case Actions
    handleAddTestCase,
    handleUpdateTestCase,
    handleDeleteTestCase,
    handleAddPendingTestCase,
    handleUpdatePendingTestCase,
    handleDeletePendingTestCase,
  } = useAssignmentForm()

  const [modules, setModules] = useState<Module[]>([])

  useEffect(() => {
    if (!classId) return

    const fetchModules = async () => {
      try {
        const fetchedModules = await getModulesByClassId(parseInt(classId, 10))
        setModules(fetchedModules)
      } catch {
      }
    }

    fetchModules()
  }, [classId])

  const moduleOptions = modules.map((m) => ({
    value: String(m.id),
    label: m.name,
  }))

  const userInitials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    : "?"
  const hasDeadlineConfigured = formData.deadline.trim().length > 0

  const topBar = useTopBar({
    user: currentUser,
    userInitials,
    breadcrumbItems: [
      { label: "Classes", to: "/dashboard/classes" },
      ...(className && classId
        ? [{ label: className, to: `/dashboard/classes/${classId}` }]
        : []),
      { label: isEditMode ? "Edit Assignment" : "Create Assignment" },
    ],
  })

  // Show loading state while fetching data
  if (isFetching) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500">Loading assignment data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout topBar={topBar}>
      <div className="mb-8">
        <div className="mb-2">
          <h1 className={dashboardTheme.pageTitle}>
            {isEditMode ? "Edit Assignment" : "Create Assignment"}
          </h1>
        </div>
        <p className={dashboardTheme.pageSubtitle}>
          {isEditMode
            ? "Update the assignment details, submission rules, and test cases."
            : className
              ? `Set up a new assignment for ${className}.`
              : "Set up a new assignment for this class."}
        </p>
        <div className={`${dashboardTheme.divider} mt-4`}></div>
      </div>

      {errors.general && (
        <div className={dashboardTheme.errorSurface}>
          <X className="h-4 w-4 shrink-0" />
          <p className="text-sm">{errors.general}</p>
        </div>
      )}

      <FormProvider {...formMethods}>
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <BasicInfoForm
                isLoading={isLoading}
                showTemplateCode={showTemplateCode}
                setShowTemplateCode={setShowTemplateCode}
                isUploadingInstructionsImage={isUploadingInstructionsImage}
                onInstructionsImageUpload={handleInstructionsImageUpload}
                onInstructionsImageRemove={handleRemoveInstructionsImage}
                // Test Case Props
                testCases={testCases}
                pendingTestCases={pendingTestCases}
                isLoadingTestCases={isLoadingTestCases}
                isEditMode={isEditMode}
                assignmentId={assignmentId}
                onAddTestCase={handleAddTestCase}
                onAddPendingTestCase={handleAddPendingTestCase}
                onUpdateTestCase={handleUpdateTestCase}
                onUpdatePendingTestCase={handleUpdatePendingTestCase}
                onDeleteTestCase={handleDeleteTestCase}
                onDeletePendingTestCase={handleDeletePendingTestCase}
                handleInputChange={handleInputChange}
              />
            </div>

            <div className="space-y-6">
              {/* Module Selector */}
              {moduleOptions.length > 0 && (
                <Card className={assignmentFormTheme.actionCard}>
                  <CardContent className="p-6 space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Module
                    </label>
                    <Select
                      options={moduleOptions}
                      value={formData.moduleId ? String(formData.moduleId) : ""}
                      onChange={(value) =>
                        handleInputChange("moduleId", value ? parseInt(value, 10) : null)
                      }
                      placeholder="Select a module..."
                      variant="light"
                    />
                    {errors.moduleId ? (
                      <p className="text-xs text-rose-600">{errors.moduleId}</p>
                    ) : (
                      <p className="text-xs text-slate-400">
                        Choose which module this assignment belongs to.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              <SubmissionSettings isLoading={isLoading} />

              <LatePenaltyConfig
                enabled={formData.allowLateSubmissions}
                config={formData.latePenaltyConfig}
                onEnabledChange={(enabled) =>
                  handleInputChange("allowLateSubmissions", enabled)
                }
                onConfigChange={(config: LatePenaltyConfigType) =>
                  handleInputChange("latePenaltyConfig", config)
                }
                disabled={isLoading || !hasDeadlineConfigured}
              />

              <Card className={assignmentFormTheme.actionCard}>
                <CardContent className="p-6 space-y-3">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white rounded-xl border border-teal-500/40 font-medium shadow-sm"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    {isEditMode ? "Save Changes" : "Create Assignment"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => navigate(-1)}
                    disabled={isLoading}
                    className="w-full h-11 rounded-xl border border-slate-300 bg-white text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </FormProvider>
    </DashboardLayout>
  )
}


