import { useNavigate } from "react-router-dom"
import { RefreshCw, Check, X } from "lucide-react"
import { DashboardLayout } from "@/presentation/components/dashboard/DashboardLayout"
import { Card, CardContent } from "@/presentation/components/ui/Card"
import { Button } from "@/presentation/components/ui/Button"
import { BackButton } from "@/presentation/components/ui/BackButton"
import { useCourseworkForm } from "@/presentation/hooks/useCourseworkForm"
import { BasicInfoForm } from "@/presentation/components/forms/coursework/BasicInfoForm"
import { SubmissionSettings } from "@/presentation/components/forms/coursework/SubmissionSettings"
import { LatePenaltyConfig } from "@/presentation/components/forms/coursework/LatePenaltyConfig"
import type { LatePenaltyConfig as LatePenaltyConfigType } from "@/shared/types/gradebook"
import { getCurrentUser } from "@/business/services/authService"
import { useTopBar } from "@/presentation/components/dashboard/TopBar"

export function CourseworkFormPage() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const {
    // State
    formData,
    errors,
    isLoading,
    isFetching,
    className,
    testCases,
    pendingTestCases,
    isLoadingTestCases,
    isUploadingDescriptionImage,
    isEditMode,
    assignmentId,
    showTemplateCode,

    // Actions
    setShowTemplateCode,
    handleInputChange,
    handleDescriptionImageUpload,
    handleRemoveDescriptionImage,
    handleSubmit,

    // Test Case Actions
    handleAddTestCase,
    handleUpdateTestCase,
    handleDeleteTestCase,
    handleAddPendingTestCase,
    handleUpdatePendingTestCase,
    handleDeletePendingTestCase,
  } = useCourseworkForm()

  const userInitials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    : "?"
  const hasDeadlineConfigured = formData.deadline.trim().length > 0

  const topBar = useTopBar({ user: currentUser, userInitials })

  // Show loading state while fetching data
  if (isFetching) {
    return (
      <DashboardLayout topBar={topBar}>
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
    <DashboardLayout topBar={topBar}>
      {/* Page Header */}
      <div className="mb-8">
        <BackButton />
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                {isEditMode ? "Edit Coursework" : "Create Coursework for"}
                {className && (
                  <span className="text-teal-400"> {className}</span>
                )}
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
            <BasicInfoForm
              formData={formData}
              errors={errors}
              isLoading={isLoading}
              showTemplateCode={showTemplateCode}
              setShowTemplateCode={setShowTemplateCode}
              onInputChange={handleInputChange}
              isUploadingDescriptionImage={isUploadingDescriptionImage}
              onDescriptionImageUpload={handleDescriptionImageUpload}
              onDescriptionImageRemove={handleRemoveDescriptionImage}
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
            />
          </div>

          {/* Right Column - Submission Settings & Actions */}
          <div className="space-y-6">
            <SubmissionSettings
              formData={formData}
              errors={errors}
              isLoading={isLoading}
              onInputChange={handleInputChange}
            />

            {/* Late Submission Policy */}
            <LatePenaltyConfig
              enabled={formData.latePenaltyEnabled}
              config={formData.latePenaltyConfig}
              onEnabledChange={(enabled) =>
                handleInputChange("latePenaltyEnabled", enabled)
              }
              onConfigChange={(config: LatePenaltyConfigType) =>
                handleInputChange("latePenaltyConfig", config)
              }
              disabled={isLoading || !hasDeadlineConfigured}
            />

            {/* Action Buttons Card */}
            <Card>
              <CardContent className="p-6 space-y-3">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white rounded-xl border border-teal-500/40 font-medium"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {isEditMode ? "Save Changes" : "Create Coursework"}
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
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </DashboardLayout>
  )
}

export default CourseworkFormPage
