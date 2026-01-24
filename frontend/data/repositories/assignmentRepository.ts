import { apiClient, type ApiResponse } from "@/data/api/apiClient";
import { supabase } from "@/data/api/supabaseClient";
import {
  mapSubmission,
  mapSubmissionWithAssignment,
  mapSubmissionWithStudent,
  mapAssignmentDetail,
} from "@/data/mappers";
import type {
  SubmitAssignmentRequest,
  SubmitAssignmentResponse,
  SubmissionListResponse,
  SubmissionHistoryResponse,
  AssignmentDetailResponse,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  TestResultsResponse,
  DeleteResponse,
} from "@/data/api/types";
import type { Assignment } from "@/shared/types/class";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001/api/v1";

export async function submitAssignment(
  request: SubmitAssignmentRequest,
): Promise<ApiResponse<SubmitAssignmentResponse>> {
  try {
    const formData = createSubmissionFormData(request);
    const authToken = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/submissions`, {
      method: "POST",
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return handleSubmissionError(response, data);
    }

    return mapSubmissionResponse(data, response.status);
  } catch (error) {
    console.error("Submission error (network or other):", error);

    return {
      error:
        error instanceof Error
          ? `Network error: ${error.message}. Make sure the backend server is running.`
          : "Failed to submit assignment",
      status: 0,
    };
  }
}

/**
 * Get submission history for a specific student and assignment
 */
export async function getSubmissionHistory(
  assignmentId: number,
  studentId: number,
): Promise<ApiResponse<SubmissionHistoryResponse>> {
  const response = await apiClient.get<SubmissionHistoryResponse>(
    `/submissions/history/${assignmentId}/${studentId}`,
  );

  if (response.data) {
    // Backend returns camelCase - use centralized mapper
    response.data = {
      ...response.data,
      submissions: response.data.submissions.map(mapSubmission),
    };
  }

  return response;
}

/**
 * Get all submissions by a student
 */
export async function getStudentSubmissions(
  studentId: number,
  latestOnly: boolean = true,
): Promise<ApiResponse<SubmissionListResponse>> {
  const response = await apiClient.get<SubmissionListResponse>(
    `/submissions/student/${studentId}?latestOnly=${latestOnly}`,
  );

  if (response.data) {
    // Backend returns camelCase - use centralized mapper
    response.data = {
      ...response.data,
      submissions: response.data.submissions.map(mapSubmissionWithAssignment),
    };
  }

  return response;
}

/**
 * Get all submissions for an assignment (typically for teachers)
 */
export async function getAssignmentSubmissions(
  assignmentId: number,
  latestOnly: boolean = true,
): Promise<ApiResponse<SubmissionListResponse>> {
  const response = await apiClient.get<SubmissionListResponse>(
    `/submissions/assignment/${assignmentId}?latestOnly=${latestOnly}`,
  );

  if (response.data) {
    // Backend returns camelCase - use centralized mapper
    response.data = {
      ...response.data,
      submissions: response.data.submissions.map(mapSubmissionWithStudent),
    };
  }

  return response;
}

/**
 * Get assignment details by ID
 */
export async function getAssignmentById(
  assignmentId: number,
  userId: number,
): Promise<ApiResponse<AssignmentDetailResponse>> {
  const response = await apiClient.get<AssignmentDetailResponse>(
    `/assignments/${assignmentId}?userId=${userId}`,
  );

  if (response.data?.assignment) {
    response.data.assignment = mapAssignmentDetail(response.data.assignment as any);
  }

  return response;
}

/**
 * Creates a new assignment for a class
 */
export async function createAssignment(
  classId: number,
  request: Omit<CreateAssignmentRequest, "classId">,
): Promise<Assignment> {
  const response = await apiClient.post<{
    success: boolean;
    message?: string;
    assignment?: Assignment;
  }>(`/classes/${classId}/assignments`, request);

  if (response.error || !response.data?.success || !response.data.assignment) {
    throw new Error(
      response.error || response.data?.message || "Failed to create assignment",
    );
  }

  return response.data.assignment;
}

/**
 * Updates an assignment
 */
export async function updateAssignment(
  assignmentId: number,
  request: UpdateAssignmentRequest,
): Promise<Assignment> {
  const response = await apiClient.put<{
    success: boolean;
    message?: string;
    assignment?: Assignment;
  }>(`/assignments/${assignmentId}`, request);

  if (response.error || !response.data?.success || !response.data.assignment) {
    throw new Error(
      response.error || response.data?.message || "Failed to update assignment",
    );
  }

  return response.data.assignment;
}

/**
 * Deletes an assignment
 */
export async function deleteAssignment(
  assignmentId: number,
  teacherId: number,
): Promise<void> {
  const response = await apiClient.delete<DeleteResponse>(
    `/assignments/${assignmentId}?teacherId=${teacherId}`,
  );

  if (response.error || !response.data?.success) {
    throw new Error(
      response.error || response.data?.message || "Failed to delete assignment",
    );
  }
}

/**
 * Get submission content for preview
 */
export async function getSubmissionContent(
  submissionId: number,
): Promise<
  ApiResponse<{ success: boolean; content: string; language?: string }>
> {
  return await apiClient.get(`/submissions/${submissionId}/content`);
}

/**
 * Get submission download URL
 */
export async function getSubmissionDownloadUrl(
  submissionId: number,
): Promise<
  ApiResponse<{ success: boolean; message: string; downloadUrl: string }>
> {
  return await apiClient.get<{
    success: boolean;
    message: string;
    downloadUrl: string;
  }>(`/submissions/${submissionId}/download`);
}

/**
 * Get test results for a submission
 * Returns the raw backend response (normalization happens in a service/utility)
 */
export async function getTestResults(
  submissionId: number,
): Promise<ApiResponse<TestResultsResponse>> {
  return await apiClient.get(`/submissions/${submissionId}/test-results`);
}

/**
 * Run tests for a submission
 */
export async function runTestsForSubmission(
  submissionId: number,
): Promise<ApiResponse<TestResultsResponse>> {
  return await apiClient.post(`/submissions/${submissionId}/run-tests`, {});
}

// Helper functions

async function getAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function createSubmissionFormData(request: SubmitAssignmentRequest): FormData {
  const formData = new FormData();
  formData.append("assignment_id", request.assignmentId.toString());
  formData.append("student_id", request.studentId.toString());
  formData.append("file", request.file);
  return formData;
}

function extractErrorMessage(data: any): string {
  if (data.detail) return data.detail;
  if (data.message) return data.message;
  if (typeof data === "string") return data;
  return "Failed to submit assignment";
}

function handleSubmissionError(
  response: Response,
  data: any,
): ApiResponse<SubmitAssignmentResponse> {
  const errorMessage = extractErrorMessage(data);

  console.error("Submission failed:", {
    status: response.status,
    statusText: response.statusText,
    error: errorMessage,
    responseData: data,
  });

  return {
    error: `${errorMessage} (Status: ${response.status})`,
    status: response.status,
  };
}

function mapSubmissionResponse(
  data: any,
  status: number,
): ApiResponse<SubmitAssignmentResponse> {
  return {
    data: {
      success: data.success,
      message: data.message,
      submission: data.submission ? mapSubmission(data.submission) : undefined,
    },
    status,
  };
}
