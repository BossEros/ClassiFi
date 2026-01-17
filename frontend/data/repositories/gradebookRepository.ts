import { apiClient } from "../api/apiClient";
import type {
  ClassGradebook,
  ClassGradebookResponse,
  StudentClassGrades,
  StudentGradesResponse,
  ClassStatistics,
  ClassStatisticsResponse,
  StudentRank,
  StudentRankResponse,
  LatePenaltyConfig,
  LatePenaltyConfigResponse,
  GradeOverrideRequest,
  LatePenaltyUpdateRequest,
} from "../api/types";

// ============================================================================
// Class Gradebook Functions
// ============================================================================

/**
 * Fetches the complete gradebook for a class
 */
export async function getClassGradebook(
  classId: number
): Promise<ClassGradebook> {
  const response = await apiClient.get<ClassGradebookResponse>(
    `/gradebook/classes/${classId}`
  );

  if (response.error || !response.data?.success) {
    throw new Error(response.error || "Failed to fetch gradebook");
  }

  return {
    assignments: response.data.assignments,
    students: response.data.students,
  };
}

/**
 * Exports the gradebook as CSV
 * Returns the CSV content as a blob
 */
export async function exportGradebookCSV(classId: number): Promise<Blob> {
  const response = await apiClient.get<string>(
    `/gradebook/classes/${classId}/export`,
    { responseType: "blob" }
  );

  if (response.error) {
    throw new Error(response.error || "Failed to export gradebook");
  }

  return new Blob([response.data as unknown as string], { type: "text/csv" });
}

/**
 * Downloads the gradebook as a CSV file
 */
export async function downloadGradebookCSV(
  classId: number,
  filename?: string
): Promise<void> {
  const blob = await exportGradebookCSV(classId);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `gradebook-class-${classId}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Fetches class statistics
 */
export async function getClassStatistics(
  classId: number
): Promise<ClassStatistics> {
  const response = await apiClient.get<ClassStatisticsResponse>(
    `/gradebook/classes/${classId}/statistics`
  );

  if (response.error || !response.data?.success) {
    throw new Error(response.error || "Failed to fetch class statistics");
  }

  return response.data.statistics;
}

// ============================================================================
// Student Grades Functions
// ============================================================================

/**
 * Fetches all grades for a student across all classes
 */
export async function getStudentGrades(
  studentId: number
): Promise<StudentClassGrades[]> {
  const response = await apiClient.get<StudentGradesResponse>(
    `/gradebook/students/${studentId}`
  );

  if (response.error || !response.data?.success) {
    throw new Error(response.error || "Failed to fetch student grades");
  }

  return response.data.grades;
}

/**
 * Fetches grades for a student in a specific class
 */
export async function getStudentClassGrades(
  studentId: number,
  classId: number
): Promise<StudentClassGrades | null> {
  const response = await apiClient.get<StudentGradesResponse>(
    `/gradebook/students/${studentId}/classes/${classId}`
  );

  if (response.error || !response.data?.success) {
    throw new Error(response.error || "Failed to fetch student class grades");
  }

  return response.data.grades[0] ?? null;
}

/**
 * Fetches student's rank in a class
 */
export async function getStudentRank(
  studentId: number,
  classId: number
): Promise<StudentRank> {
  const response = await apiClient.get<StudentRankResponse>(
    `/gradebook/students/${studentId}/classes/${classId}/rank`
  );

  if (response.error || !response.data?.success) {
    throw new Error(response.error || "Failed to fetch student rank");
  }

  return {
    rank: response.data.rank,
    totalStudents: response.data.totalStudents,
    percentile: response.data.percentile,
  };
}

// ============================================================================
// Grade Override Functions
// ============================================================================

/**
 * Overrides a grade for a submission
 */
export async function overrideGrade(
  submissionId: number,
  grade: number,
  feedback?: string | null
): Promise<void> {
  const body: GradeOverrideRequest = { grade, feedback };
  const response = await apiClient.post<{ success: boolean; message?: string }>(
    `/gradebook/submissions/${submissionId}/override`,
    body
  );

  if (response.error || !response.data?.success) {
    throw new Error(
      response.error || response.data?.message || "Failed to override grade"
    );
  }
}

/**
 * Removes a grade override
 */
export async function removeGradeOverride(submissionId: number): Promise<void> {
  const response = await apiClient.delete<{
    success: boolean;
    message?: string;
  }>(`/gradebook/submissions/${submissionId}/override`);

  if (response.error || !response.data?.success) {
    throw new Error(
      response.error ||
        response.data?.message ||
        "Failed to remove grade override"
    );
  }
}

// ============================================================================
// Late Penalty Configuration Functions
// ============================================================================

/**
 * Fetches late penalty configuration for an assignment
 */
export async function getLatePenaltyConfig(
  assignmentId: number
): Promise<{ enabled: boolean; config: LatePenaltyConfig | null }> {
  const response = await apiClient.get<LatePenaltyConfigResponse>(
    `/gradebook/assignments/${assignmentId}/late-penalty`
  );

  if (response.error || !response.data?.success) {
    throw new Error(response.error || "Failed to fetch late penalty config");
  }

  return {
    enabled: response.data.enabled,
    config: response.data.config,
  };
}

/**
 * Updates late penalty configuration for an assignment
 */
export async function updateLatePenaltyConfig(
  assignmentId: number,
  enabled: boolean,
  config?: LatePenaltyConfig
): Promise<void> {
  const body: LatePenaltyUpdateRequest = { enabled, config };
  const response = await apiClient.put<{ success: boolean; message?: string }>(
    `/gradebook/assignments/${assignmentId}/late-penalty`,
    body
  );

  if (response.error || !response.data?.success) {
    throw new Error(
      response.error ||
        response.data?.message ||
        "Failed to update late penalty config"
    );
  }
}
