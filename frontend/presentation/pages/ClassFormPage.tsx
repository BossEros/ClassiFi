import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  RefreshCw,
  Check,
  X,
  Plus,
  Edit,
} from "lucide-react";
import { DashboardLayout } from "@/presentation/components/dashboard/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/presentation/components/ui/Card";
import { getCurrentUser } from "@/business/services/authService";
import {
  createClass,
  generateClassCode,
  getClassById,
  updateClass,
} from "@/business/services/classService";
import { Input } from "@/presentation/components/ui/Input";
import { Textarea } from "@/presentation/components/ui/Textarea";
import { Button } from "@/presentation/components/ui/Button";
import { useToast } from "@/shared/context/ToastContext";
import { DAYS, TIME_OPTIONS } from "@/shared/constants/schedule";
import { formatTimeDisplay } from "@/shared/utils/timeUtils";
import { getCurrentAcademicYear } from "@/shared/utils/dateUtils";
import type { Schedule, DayOfWeek } from "@/business/models/dashboard/types";

interface FormData {
  className: string;
  description: string;
  classCode: string;
  yearLevel: 1 | 2 | 3 | 4;
  semester: 1 | 2;
  academicYear: string;
  schedule: Schedule;
}

interface FormErrors {
  className?: string;
  classCode?: string;
  academicYear?: string;
  schedule?: string;
  general?: string;
}

export function ClassFormPage() {
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const { showToast } = useToast();
  const currentUser = getCurrentUser();

  // Determine if we're in edit mode
  const isEditMode = !!classId;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<FormData>({
    className: "",
    description: "",
    classCode: "",
    yearLevel: 1,
    semester: 1,
    academicYear: getCurrentAcademicYear(),
    schedule: {
      days: [],
      startTime: "08:00",
      endTime: "09:30",
    },
  });

  // Fetch existing class data when in edit mode
  useEffect(() => {
    if (isEditMode && classId) {
      const user = getCurrentUser();
      if (!user) return;

      const fetchClassData = async () => {
        setIsFetching(true);
        try {
          const classData = await getClassById(
            parseInt(classId),
            parseInt(user.id)
          );
          setFormData({
            className: classData.className,
            description: classData.description || "",
            classCode: classData.classCode,
            yearLevel: classData.yearLevel as 1 | 2 | 3 | 4,
            semester: classData.semester as 1 | 2,
            academicYear: classData.academicYear,
            schedule: classData.schedule,
          });
        } catch (error) {
          setErrors({
            general: "Failed to load class data. Please try again.",
          });
        } finally {
          setIsFetching(false);
        }
      };
      fetchClassData();
    }
  }, [isEditMode, classId]);

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      const code = await generateClassCode();
      setFormData((prev) => ({ ...prev, classCode: code }));
      setErrors((prev) => ({ ...prev, classCode: undefined }));
    } catch {
      setErrors((prev) => ({ ...prev, classCode: "Failed to generate code" }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | number | Schedule
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
  };

  const toggleDay = (day: DayOfWeek) => {
    const newDays = formData.schedule.days.includes(day)
      ? formData.schedule.days.filter((d) => d !== day)
      : [...formData.schedule.days, day];
    handleInputChange("schedule", { ...formData.schedule, days: newDays });
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.className.trim()) {
      newErrors.className = "Class name is required";
    }

    if (!formData.classCode) {
      newErrors.classCode = "Please generate a class code";
    }

    // Validate academic year format (YYYY-YYYY)
    const academicYearRegex = /^\d{4}-\d{4}$/;
    if (!formData.academicYear) {
      newErrors.academicYear = "Academic year is required";
    } else if (!academicYearRegex.test(formData.academicYear)) {
      newErrors.academicYear = "Format must be YYYY-YYYY (e.g., 2024-2025)";
    } else {
      const [startYear, endYear] = formData.academicYear.split("-").map(Number);
      if (endYear !== startYear + 1) {
        newErrors.academicYear =
          "End year must be exactly 1 year after start year";
      }
    }

    if (formData.schedule.days.length === 0) {
      newErrors.schedule = "Select at least one day";
    }

    if (formData.schedule.startTime >= formData.schedule.endTime) {
      newErrors.schedule = "End time must be after start time";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!currentUser?.id) {
      setErrors({ general: "You must be logged in" });
      return;
    }

    setIsLoading(true);

    try {
      if (isEditMode && classId) {
        // Update existing class
        await updateClass(parseInt(classId), {
          teacherId: parseInt(currentUser.id),
          className: formData.className.trim(),
          description: formData.description.trim() || undefined,
          yearLevel: formData.yearLevel,
          semester: formData.semester,
          academicYear: formData.academicYear,
          schedule: formData.schedule,
        });
        showToast("Class updated successfully");
        navigate(`/dashboard/classes/${classId}`);
      } else {
        // Create new class
        await createClass({
          teacherId: parseInt(currentUser.id),
          className: formData.className.trim(),
          description: formData.description.trim() || undefined,
          classCode: formData.classCode,
          yearLevel: formData.yearLevel,
          semester: formData.semester,
          academicYear: formData.academicYear,
          schedule: formData.schedule,
        });
        showToast("Class created successfully");
        navigate("/dashboard/classes");
      }
    } catch {
      setErrors({
        general: `Failed to ${
          isEditMode ? "update" : "create"
        } class. Please try again.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while fetching class data in edit mode
  if (isFetching) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading class data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
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
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {isEditMode ? "Edit Class" : "Create New Class"}
            </h1>
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
        <p className="text-gray-400 ml-11 text-sm">
          {isEditMode
            ? "Update your class information"
            : "Set up a new class for your students"}
        </p>
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
                    <BookOpen className="w-5 h-5 text-purple-300" />
                  </div>
                  <div>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription className="mt-1">
                      Enter the core details for your class
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Class Name */}
                <div className="space-y-2">
                  <label
                    htmlFor="className"
                    className="text-sm font-medium text-white"
                  >
                    Class Name <span className="text-red-400">*</span>
                  </label>
                  <Input
                    id="className"
                    type="text"
                    placeholder="e.g., Introduction to Programming"
                    value={formData.className}
                    onChange={(e) =>
                      handleInputChange("className", e.target.value)
                    }
                    disabled={isLoading}
                    className={errors.className ? "border-red-500/50" : ""}
                  />
                  {errors.className && (
                    <p className="text-xs text-red-400">{errors.className}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label
                    htmlFor="description"
                    className="text-sm font-medium text-white"
                  >
                    Description
                  </label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the class..."
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    disabled={isLoading}
                    rows={3}
                  />
                </div>

                {/* Class Code */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">
                    Class Code <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={formData.classCode}
                      placeholder={isEditMode ? "" : "Click Generate"}
                      readOnly
                      className={`flex-1 bg-white/5 font-mono text-lg tracking-wider uppercase ${
                        errors.classCode ? "border-red-500/50" : ""
                      } ${
                        isEditMode ? "text-gray-400 cursor-not-allowed" : ""
                      }`}
                      disabled={isLoading || isEditMode}
                    />
                    {!isEditMode && (
                      <Button
                        type="button"
                        onClick={handleGenerateCode}
                        disabled={isGenerating || isLoading}
                        className="w-auto px-4 bg-white/10 hover:bg-white/20 text-white border border-white/20"
                      >
                        {isGenerating ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          "Generate"
                        )}
                      </Button>
                    )}
                  </div>
                  {errors.classCode && (
                    <p className="text-xs text-red-400">{errors.classCode}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    {isEditMode
                      ? "Class code cannot be changed after creation"
                      : "Students will use this code to join the class"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Clock className="w-5 h-5 text-green-300" />
                  </div>
                  <div>
                    <CardTitle>Schedule</CardTitle>
                    <CardDescription className="mt-1">
                      Set when this class meets
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Days */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white">
                    Days <span className="text-red-400">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        disabled={isLoading}
                        title={day.label}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          formData.schedule.days.includes(day.value)
                            ? "bg-purple-500 text-white border-transparent"
                            : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {day.short}
                      </button>
                    ))}
                  </div>
                  {errors.schedule && (
                    <p className="text-xs text-red-400">{errors.schedule}</p>
                  )}
                </div>

                {/* Time */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white">Time</label>
                  <div className="flex items-center gap-3">
                    <select
                      value={formData.schedule.startTime}
                      onChange={(e) =>
                        handleInputChange("schedule", {
                          ...formData.schedule,
                          startTime: e.target.value,
                        })
                      }
                      disabled={isLoading}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                    >
                      {TIME_OPTIONS.map((time) => (
                        <option
                          key={time}
                          value={time}
                          className="bg-slate-800 text-white"
                        >
                          {formatTimeDisplay(time)}
                        </option>
                      ))}
                    </select>
                    <span className="text-gray-400 text-sm">to</span>
                    <select
                      value={formData.schedule.endTime}
                      onChange={(e) =>
                        handleInputChange("schedule", {
                          ...formData.schedule,
                          endTime: e.target.value,
                        })
                      }
                      disabled={isLoading}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                    >
                      {TIME_OPTIONS.map((time) => (
                        <option
                          key={time}
                          value={time}
                          className="bg-slate-800 text-white"
                        >
                          {formatTimeDisplay(time)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Academic Period & Actions */}
          <div className="space-y-6">
            {/* Academic Period Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Calendar className="w-5 h-5 text-blue-300" />
                  </div>
                  <div>
                    <CardTitle>Academic Period</CardTitle>
                    <CardDescription className="mt-1">
                      When this class runs
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Year Level */}
                <div className="space-y-2">
                  <label
                    htmlFor="yearLevel"
                    className="text-sm font-medium text-white"
                  >
                    Year Level <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="yearLevel"
                    value={formData.yearLevel}
                    onChange={(e) =>
                      handleInputChange(
                        "yearLevel",
                        parseInt(e.target.value) as 1 | 2 | 3 | 4
                      )
                    }
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                  >
                    <option value={1} className="bg-slate-800 text-white">
                      1st Year
                    </option>
                    <option value={2} className="bg-slate-800 text-white">
                      2nd Year
                    </option>
                    <option value={3} className="bg-slate-800 text-white">
                      3rd Year
                    </option>
                    <option value={4} className="bg-slate-800 text-white">
                      4th Year
                    </option>
                  </select>
                </div>

                {/* Semester */}
                <div className="space-y-2">
                  <label
                    htmlFor="semester"
                    className="text-sm font-medium text-white"
                  >
                    Semester <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="semester"
                    value={formData.semester}
                    onChange={(e) =>
                      handleInputChange(
                        "semester",
                        parseInt(e.target.value) as 1 | 2
                      )
                    }
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                  >
                    <option value={1} className="bg-slate-800 text-white">
                      1st Semester
                    </option>
                    <option value={2} className="bg-slate-800 text-white">
                      2nd Semester
                    </option>
                  </select>
                </div>

                {/* Academic Year */}
                <div className="space-y-2">
                  <label
                    htmlFor="academicYear"
                    className="text-sm font-medium text-white"
                  >
                    Academic Year <span className="text-red-400">*</span>
                  </label>
                  <Input
                    id="academicYear"
                    type="text"
                    placeholder="e.g., 2024-2025"
                    value={formData.academicYear}
                    onChange={(e) =>
                      handleInputChange("academicYear", e.target.value)
                    }
                    disabled={isLoading}
                    className={errors.academicYear ? "border-red-500/50" : ""}
                  />
                  {errors.academicYear && (
                    <p className="text-xs text-red-400">
                      {errors.academicYear}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Format: YYYY-YYYY (e.g., 2024-2025)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons Card */}
            <Card>
              <CardContent className="p-6 space-y-3">
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {isEditMode ? "Save Changes" : "Create Class"}
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
  );
}

// Export with both names for backwards compatibility
export { ClassFormPage as CreateClassPage };
export default ClassFormPage;
