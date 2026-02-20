import { apiClient, type ApiResponse } from "@/data/api/apiClient"
import { supabase } from "@/data/api/supabaseClient"
import { sanitizeUserFacingErrorMessage } from "@/data/api/errorMapping"
import {
  mapSubmission,
  mapSubmissionWithAssignment,
  mapSubmissionWithStudent,
  mapAssignmentDetail,
} from "@/data/mappers"
import type {
  SubmitAssignmentRequest,
  SubmitAssignmentResponse,
  SubmissionListResponse,
  SubmissionHistoryResponse,
  AssignmentDetailResponse,
  MappedAssignmentDetailResponse,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  SubmissionDTO,
} from "@/data/api/assignment.types"
import type { TestResultsResponse } from "@/data/api/test-case.types"
import type { DeleteResponse } from "@/data/api/class.types"
import type { Assignment } from "@/shared/types/class"
import type { Submission } from "@/shared/types/submission"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8001/api/v1"
const DEFAULT_ASSIGNMENT_INSTRUCTIONS_BUCKET = "assignment-descriptions"
const ASSIGNMENT_INSTRUCTIONS_FALLBACK_BUCKET =
  "assignment-descriptions-fallback"
const ASSIGNMENT_INSTRUCTIONS_BUCKET = getConfiguredAssignmentInstructionsBucket()
const ASSIGNMENT_INSTRUCTIONS_BUCKET_CANDIDATES =
  resolveAssignmentInstructionsBucketCandidates(ASSIGNMENT_INSTRUCTIONS_BUCKET)

export async function submitAssignmentWithFile(
  submissionRequest: SubmitAssignmentRequest,
): Promise<ApiResponse<SubmitAssignmentResponse>> {
  try {
    const submissionFormData =
      buildSubmissionFormDataFromRequest(submissionRequest)
    const authenticationToken = await retrieveAuthenticationTokenFromSession()

    const httpResponse = await fetch(`${API_BASE_URL}/submissions`, {
      method: "POST",
      headers: authenticationToken
        ? { Authorization: `Bearer ${authenticationToken}` }
        : {},
      body: submissionFormData,
    })

    const responseData = await httpResponse.json()

    if (!httpResponse.ok) {
      return buildErrorResponseForFailedSubmission(httpResponse, responseData)
    }

    return buildSuccessResponseFromSubmissionData(
      responseData,
      httpResponse.status,
    )
  } catch (networkError) {
    console.error("Submission error (network or other):", networkError)

    return {
      error:
        networkError instanceof Error
          ? `Network error: ${networkError.message}. Make sure the backend server is running.`
          : "Failed to submit assignment",
      status: 0,
    }
  }
}

export async function getSubmissionHistoryForStudentAndAssignment(
  assignmentId: number,
  studentId: number,
): Promise<ApiResponse<SubmissionHistoryResponse>> {
  const apiResponse = await apiClient.get<SubmissionHistoryResponse>(
    `/submissions/history/${assignmentId}/${studentId}`,
  )

  if (apiResponse.data) {
    apiResponse.data = {
      ...apiResponse.data,
      submissions: apiResponse.data.submissions.map(mapSubmission),
    }
  }

  return apiResponse
}

export async function getAllSubmissionsByStudentId(
  studentId: number,
  shouldReturnLatestSubmissionsOnly: boolean = true,
): Promise<ApiResponse<SubmissionListResponse>> {
  const apiResponse = await apiClient.get<SubmissionListResponse>(
    `/submissions/student/${studentId}?latestOnly=${shouldReturnLatestSubmissionsOnly}`,
  )

  if (apiResponse.data) {
    apiResponse.data = {
      ...apiResponse.data,
      submissions: apiResponse.data.submissions.map(
        mapSubmissionWithAssignment,
      ),
    }
  }

  return apiResponse
}

export async function getAllSubmissionsForAssignmentId(
  assignmentId: number,
  shouldReturnLatestSubmissionsOnly: boolean = true,
): Promise<ApiResponse<SubmissionListResponse>> {
  const apiResponse = await apiClient.get<SubmissionListResponse>(
    `/submissions/assignment/${assignmentId}?latestOnly=${shouldReturnLatestSubmissionsOnly}`,
  )

  if (apiResponse.data) {
    apiResponse.data = {
      ...apiResponse.data,
      submissions: apiResponse.data.submissions.map(mapSubmissionWithStudent),
    }
  }

  return apiResponse
}

export async function getAssignmentDetailsByIdForUser(
  assignmentId: number,
  userId: number,
): Promise<ApiResponse<MappedAssignmentDetailResponse>> {
  const apiResponse = await apiClient.get<AssignmentDetailResponse>(
    `/assignments/${assignmentId}?userId=${userId}`,
  )

  if (apiResponse.data?.assignment) {
    // Map DTO to domain model with proper type validation
    const mappedAssignment = mapAssignmentDetail(apiResponse.data.assignment)

    return {
      ...apiResponse,
      data: {
        success: apiResponse.data.success,
        message: apiResponse.data.message,
        assignment: mappedAssignment,
      },
    }
  }

  return apiResponse as ApiResponse<MappedAssignmentDetailResponse>
}

export async function createNewAssignmentForClass(
  classId: number,
  newAssignmentData: Omit<CreateAssignmentRequest, "classId">,
): Promise<Assignment> {
  const apiResponse = await apiClient.post<{
    success: boolean
    message?: string
    assignment?: Assignment
  }>(`/classes/${classId}/assignments`, newAssignmentData)

  if (
    apiResponse.error ||
    !apiResponse.data?.success ||
    !apiResponse.data.assignment
  ) {
    throw new Error(
      apiResponse.error ||
        apiResponse.data?.message ||
        "Failed to create assignment",
    )
  }

  return apiResponse.data.assignment
}

export async function updateAssignmentDetailsById(
  assignmentId: number,
  updatedAssignmentData: UpdateAssignmentRequest,
): Promise<Assignment> {
  const apiResponse = await apiClient.put<{
    success: boolean
    message?: string
    assignment?: Assignment
  }>(`/assignments/${assignmentId}`, updatedAssignmentData)

  if (
    apiResponse.error ||
    !apiResponse.data?.success ||
    !apiResponse.data.assignment
  ) {
    throw new Error(
      apiResponse.error ||
        apiResponse.data?.message ||
        "Failed to update assignment",
    )
  }

  return apiResponse.data.assignment
}

export async function deleteAssignmentByIdForTeacher(
  assignmentId: number,
  teacherId: number,
): Promise<void> {
  const apiResponse = await apiClient.delete<DeleteResponse>(
    `/assignments/${assignmentId}?teacherId=${teacherId}`,
  )

  if (apiResponse.error || !apiResponse.data?.success) {
    throw new Error(
      apiResponse.error ||
        apiResponse.data?.message ||
        "Failed to delete assignment",
    )
  }
}

export async function getSubmissionFileContentById(
  submissionId: number,
): Promise<
  ApiResponse<{ success: boolean; content: string; language?: string }>
> {
  return await apiClient.get(`/submissions/${submissionId}/content`)
}

export async function getSubmissionFileDownloadUrlById(
  submissionId: number,
): Promise<
  ApiResponse<{ success: boolean; message: string; downloadUrl: string }>
> {
  return await apiClient.get<{
    success: boolean
    message: string
    downloadUrl: string
  }>(`/submissions/${submissionId}/download`)
}

export async function getTestResultsForSubmissionById(
  submissionId: number,
): Promise<ApiResponse<TestResultsResponse>> {
  return await apiClient.get(`/submissions/${submissionId}/test-results`)
}

export async function executeTestsForSubmissionById(
  submissionId: number,
): Promise<ApiResponse<TestResultsResponse>> {
  return await apiClient.post(`/submissions/${submissionId}/run-tests`, {})
}

/**
 * Sends deadline reminder notifications to students who haven't submitted an assignment.
 *
 * @param assignmentId - The assignment ID
 * @param teacherId - The teacher ID (for authorization)
 * @returns API response with success message and count of reminders sent
 */
export async function sendReminderToNonSubmitters(
  assignmentId: number,
  teacherId: number,
): Promise<ApiResponse<{ success: boolean; message: string }>> {
  return await apiClient.post(
    `/assignments/${assignmentId}/send-reminder?teacherId=${teacherId}`,
    {},
  )
}

/**
 * Uploads an assignment instructions image to Supabase Storage and returns its public URL.
 */
export async function uploadAssignmentInstructionsImage(
  teacherId: number,
  classId: number,
  file: File,
): Promise<string> {
  const fileExtension = resolveFileExtension(file)
  const safeBaseName = sanitizeFilename(file.name.replace(/\.[^/.]+$/, ""))
  const filePath = `${teacherId}/${classId}/${Date.now()}_${safeBaseName}.${fileExtension}`
  let lastUploadErrorMessage: string | null = null

  for (const bucketName of ASSIGNMENT_INSTRUCTIONS_BUCKET_CANDIDATES) {
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (!uploadError) {
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(filePath)

      return publicUrl
    }

    lastUploadErrorMessage = uploadError.message || "Failed to upload assignment image"

    if (isStorageBucketConfigurationError(uploadError.message)) {
      continue
    }

    throw new Error(lastUploadErrorMessage)
  }

  throw new Error(
    lastUploadErrorMessage ||
      "Assignment image storage is not configured. Configure VITE_SUPABASE_ASSIGNMENT_INSTRUCTIONS_BUCKET or create the assignment-descriptions bucket with upload permissions.",
  )
}

/**
 * Deletes an assignment instructions image from Supabase Storage.
 * Fails silently if deletion is unsuccessful.
 */
export async function deleteAssignmentInstructionsImage(
  imageUrl: string,
): Promise<void> {
  try {
    const storageLocation = parseStorageLocationFromPublicUrl(imageUrl)
    if (!storageLocation) {
      return
    }

    await supabase.storage
      .from(storageLocation.bucket)
      .remove([storageLocation.path])
  } catch (error) {
    console.error("Failed to delete assignment instructions image:", error)
  }
}

// Helper functions

function resolveFileExtension(file: File): string {
  const extensionFromName = file.name.split(".").pop()
  if (extensionFromName && extensionFromName !== file.name) {
    return extensionFromName.toLowerCase()
  }

  const mimeToExtension: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  }

  return mimeToExtension[file.type] || "jpg"
}

function sanitizeFilename(fileName: string): string {
  const normalizedFileName = fileName.trim().toLowerCase()
  const sanitizedFileName = normalizedFileName.replace(/[^a-z0-9-_]/g, "-")
  const compactFileName = sanitizedFileName.replace(/-+/g, "-")
  return compactFileName || "assignment-instructions"
}

function getConfiguredAssignmentInstructionsBucket(): string {
  const configuredBucketName =
    import.meta.env.VITE_SUPABASE_ASSIGNMENT_INSTRUCTIONS_BUCKET

  if (
    typeof configuredBucketName === "string" &&
    configuredBucketName.trim().length > 0
  ) {
    return configuredBucketName.trim()
  }

  return DEFAULT_ASSIGNMENT_INSTRUCTIONS_BUCKET
}

function resolveAssignmentInstructionsBucketCandidates(
  primaryBucketName: string,
): string[] {
  const candidateBuckets = [
    primaryBucketName,
    DEFAULT_ASSIGNMENT_INSTRUCTIONS_BUCKET,
    ASSIGNMENT_INSTRUCTIONS_FALLBACK_BUCKET,
  ]

  return Array.from(
    new Set(
      candidateBuckets
        .map((bucketName) => bucketName.trim())
        .filter((bucketName) => bucketName.length > 0),
    ),
  )
}

function isStorageBucketConfigurationError(errorMessage: string): boolean {
  const normalizedMessage = errorMessage.toLowerCase()

  return (
    normalizedMessage.includes("bucket") ||
    normalizedMessage.includes("not found") ||
    normalizedMessage.includes("does not exist") ||
    normalizedMessage.includes("row-level security") ||
    normalizedMessage.includes("permission denied") ||
    normalizedMessage.includes("not authorized")
  )
}

interface StorageLocation {
  bucket: string
  path: string
}

function parseStorageLocationFromPublicUrl(
  storagePublicUrl: string,
): StorageLocation | null {
  if (!storagePublicUrl?.trim()) {
    return null
  }

  const parsedAbsoluteUrlLocation =
    parseStorageLocationFromAbsoluteUrl(storagePublicUrl)
  if (parsedAbsoluteUrlLocation) {
    return parsedAbsoluteUrlLocation
  }

  const legacyBucketLocation = parseStorageLocationFromLegacyPattern(
    storagePublicUrl,
  )
  if (legacyBucketLocation) {
    return legacyBucketLocation
  }

  const [bucketName, ...pathSegments] = storagePublicUrl.split("/")
  if (!bucketName || pathSegments.length === 0) {
    return null
  }

  const normalizedPath = pathSegments.join("/").split("?")[0]
  if (!normalizedPath) {
    return null
  }

  return { bucket: bucketName, path: normalizedPath }
}

function parseStorageLocationFromAbsoluteUrl(
  storagePublicUrl: string,
): StorageLocation | null {
  try {
    const parsedUrl = new URL(storagePublicUrl)
    const storagePublicMarker = "/storage/v1/object/public/"
    const storageMarkerIndex = parsedUrl.pathname.indexOf(storagePublicMarker)

    if (storageMarkerIndex === -1) {
      return null
    }

    const bucketAndPath = parsedUrl.pathname.slice(
      storageMarkerIndex + storagePublicMarker.length,
    )
    const [bucketName, ...pathSegments] = bucketAndPath.split("/")

    if (!bucketName || pathSegments.length === 0) {
      return null
    }

    const decodedPath = decodeURIComponent(pathSegments.join("/"))
    if (!decodedPath) {
      return null
    }

    return {
      bucket: decodeURIComponent(bucketName),
      path: decodedPath,
    }
  } catch {
    return null
  }
}

function parseStorageLocationFromLegacyPattern(
  storagePublicUrl: string,
): StorageLocation | null {
  for (const bucketName of ASSIGNMENT_INSTRUCTIONS_BUCKET_CANDIDATES) {
    const bucketMarker = `/${bucketName}/`
    if (!storagePublicUrl.includes(bucketMarker)) {
      continue
    }

    const pathParts = storagePublicUrl.split(bucketMarker)
    const rawPath = pathParts[pathParts.length - 1].split("?")[0]

    if (!rawPath) {
      return null
    }

    return {
      bucket: bucketName,
      path: rawPath,
    }
  }

  return null
}

async function retrieveAuthenticationTokenFromSession(): Promise<
  string | null
> {
  const { data: sessionData } = await supabase.auth.getSession()
  return sessionData.session?.access_token ?? null
}

function buildSubmissionFormDataFromRequest(
  submissionRequest: SubmitAssignmentRequest,
): FormData {
  const formData = new FormData()
  formData.append("assignment_id", submissionRequest.assignmentId.toString())
  formData.append("student_id", submissionRequest.studentId.toString())
  formData.append("file", submissionRequest.file)
  return formData
}

function extractErrorMessageFromResponseData(responseData: unknown): string {
  if (typeof responseData === "object" && responseData !== null) {
    const data = responseData as Record<string, unknown>
    if (data.detail && typeof data.detail === "string") return data.detail
    if (data.message && typeof data.message === "string") return data.message
  }
  if (typeof responseData === "string") return responseData
  return "Failed to submit assignment"
}

function buildErrorResponseForFailedSubmission(
  httpResponse: Response,
  responseData: unknown,
): ApiResponse<SubmitAssignmentResponse> {
  const errorMessage = extractErrorMessageFromResponseData(responseData)

  console.error("Submission failed:", {
    status: httpResponse.status,
    statusText: httpResponse.statusText,
    error: errorMessage,
    responseData: responseData,
  })

  return {
    error: sanitizeUserFacingErrorMessage(errorMessage),
    status: httpResponse.status,
  }
}

function buildSuccessResponseFromSubmissionData(
  responseData: unknown,
  httpStatusCode: number,
): ApiResponse<SubmitAssignmentResponse> {
  // Validate responseData is an object
  if (typeof responseData !== "object" || responseData === null) {
    throw new Error("Invalid response data: expected object")
  }

  const data = responseData as Record<string, unknown>

  // Validate success field
  const success = typeof data.success === "boolean" ? data.success : false

  // Validate message field
  const message = typeof data.message === "string" ? data.message : undefined

  // Validate submission field
  let submission: Submission | undefined = undefined

  if (
    typeof data.submission === "object" &&
    data.submission !== null &&
    "id" in data.submission &&
    "assignmentId" in data.submission &&
    "studentId" in data.submission &&
    "fileName" in data.submission
  ) {
    // Only map if submission has the expected structure
    submission = mapSubmission(data.submission as SubmissionDTO)
  }

  return {
    data: {
      success,
      message,
      submission,
    },
    status: httpStatusCode,
  }
}
