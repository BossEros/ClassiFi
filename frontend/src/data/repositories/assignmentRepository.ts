import { apiClient, type ApiResponse, unwrapApiResponse } from "@/data/api/apiClient"
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
  StorageLocation,
} from "@/data/api/assignment.types"
import type { TestResultsResponse } from "@/data/api/test-case.types"
import type { DeleteResponse } from "@/data/api/class.types"
import type { Assignment } from "@/data/api/class.types"
import type { Submission } from "@/data/api/shared.types"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8001/api/v1"
const DEFAULT_ASSIGNMENT_INSTRUCTIONS_BUCKET = "assignment-descriptions"
const ASSIGNMENT_INSTRUCTIONS_FALLBACK_BUCKET =
  "assignment-descriptions-fallback"
const ASSIGNMENT_INSTRUCTIONS_BUCKET =
  getConfiguredAssignmentInstructionsBucket()
const ASSIGNMENT_INSTRUCTIONS_BUCKET_CANDIDATES =
  resolveAssignmentInstructionsBucketCandidates(ASSIGNMENT_INSTRUCTIONS_BUCKET)

/**
 * Submits a student's assignment file using multipart upload to the backend.
 * Handles token injection, response validation, and user-friendly error mapping.
 *
 * @param submissionRequest - Submission payload containing assignment, student, and file data.
 * @returns API response containing submission result or normalized error details.
 */
export async function submitAssignmentWithFile(
  submissionRequest: SubmitAssignmentRequest,
): Promise<ApiResponse<SubmitAssignmentResponse>> {
  try {
    // STEP 1: Pack the assignment ID, student ID, and uploaded file into a multipart FormData
    // payload — the backend expects this as a multipart/form-data POST, not JSON
    const submissionFormData = buildSubmissionFormDataFromRequest(submissionRequest)

    // STEP 2: Pull the JWT from the active Supabase session so the backend can authenticate the request
    const authenticationToken = await retrieveAuthenticationTokenFromSession()

    // STEP 3: POST the multipart payload — the backend validates the assignment window,
    // saves the file to storage, queues test execution, and returns the new submission record
    const httpResponse = await fetch(`${API_BASE_URL}/submissions`, {
      method: "POST",
      headers: authenticationToken
        ? { Authorization: `Bearer ${authenticationToken}` }
        : {},
      body: submissionFormData,
    })

    // STEP 4: Parse the response body and normalize it into a typed ApiResponse
    const responseData = await httpResponse.json()

    if (!httpResponse.ok) {
      return buildErrorResponseForFailedSubmission(httpResponse, responseData)
    }

    return buildSuccessResponseFromSubmissionData(
      responseData,
      httpResponse.status,
    )
  } catch (networkError) {

    return {
      error:
        networkError instanceof Error
          ? `Network error: ${networkError.message}. Make sure the backend server is running.`
          : "Failed to submit assignment",
      status: 0,
    }
  }
}

/**
 * Retrieves submission history for one student in one assignment.
 * Maps API DTOs into normalized submission models.
 *
 * @param assignmentId - The unique identifier of the assignment.
 * @param studentId - The unique identifier of the student.
 * @returns API response containing the student's submission history.
 */
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

/**
 * Retrieves submissions made by a student across assignments.
 * Optionally limits to each assignment's latest submission.
 *
 * @param studentId - The unique identifier of the student.
 * @param shouldReturnLatestSubmissionsOnly - Whether to include only latest attempts.
 * @returns API response containing student submissions.
 */
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

/**
 * Retrieves submissions for a specific assignment.
 * Optionally limits to latest submissions and maps student-enriched submission DTOs.
 *
 * @param assignmentId - The unique identifier of the assignment.
 * @param shouldReturnLatestSubmissionsOnly - Whether to include only latest attempts.
 * @returns API response containing assignment submissions.
 */
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

/**
 * Retrieves assignment details for a specific user context.
 * Maps backend assignment DTOs into strongly typed frontend models.
 *
 * @param assignmentId - The unique identifier of the assignment.
 * @param userId - The user requesting assignment details.
 * @returns API response containing a mapped assignment detail payload.
 */
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

/**
 * Creates a new assignment inside a class.
 *
 * @param classId - The unique identifier of the target class.
 * @param newAssignmentData - Assignment creation payload without classId.
 * @returns The created assignment entity.
 * @throws Error if creation fails or response payload is missing assignment data.
 */
export async function createNewAssignmentForClass(
  classId: number,
  newAssignmentData: Omit<CreateAssignmentRequest, "classId">,
): Promise<Assignment> {
  const apiResponse = await apiClient.post<{
    success: boolean
    message?: string
    assignment?: Assignment
  }>(`/classes/${classId}/assignments`, newAssignmentData)

  const data = unwrapApiResponse(
    apiResponse,
    "Failed to create assignment",
    "assignment",
  )
  
  const createdAssignment = data.assignment

  if (!createdAssignment) {
    throw new Error("Failed to create assignment: missing assignment")
  }

  return createdAssignment
}

/**
 * Updates an existing assignment by ID.
 *
 * @param assignmentId - The unique identifier of the assignment.
 * @param updatedAssignmentData - Assignment fields to update.
 * @returns The updated assignment entity.
 * @throws Error if update fails or response payload is missing assignment data.
 */
export async function updateAssignmentDetailsById(
  assignmentId: number,
  updatedAssignmentData: UpdateAssignmentRequest,
): Promise<Assignment> {
  const apiResponse = await apiClient.put<{
    success: boolean
    message?: string
    assignment?: Assignment
  }>(`/assignments/${assignmentId}`, updatedAssignmentData)
  const data = unwrapApiResponse(
    apiResponse,
    "Failed to update assignment",
    "assignment",
  )
  const updatedAssignment = data.assignment

  if (!updatedAssignment) {
    throw new Error("Failed to update assignment: missing assignment")
  }

  return updatedAssignment
}

/**
 * Deletes an assignment and validates teacher authorization through query parameters.
 *
 * @param assignmentId - The unique identifier of the assignment.
 * @param teacherId - The unique identifier of the requesting teacher.
 */
export async function deleteAssignmentByIdForTeacher(
  assignmentId: number,
  teacherId: number,
): Promise<void> {
  const apiResponse = await apiClient.delete<DeleteResponse>(
    `/assignments/${assignmentId}?teacherId=${teacherId}`,
  )
  unwrapApiResponse(apiResponse, "Failed to delete assignment")
}

/**
 * Retrieves raw submission file content for code viewer rendering.
 *
 * @param submissionId - The unique identifier of the submission.
 * @returns API response containing source content and optional language metadata.
 */
export async function getSubmissionFileContentById(
  submissionId: number,
): Promise<
  ApiResponse<{ success: boolean; content: string; language?: string }>
> {
  return await apiClient.get(`/submissions/${submissionId}/content`)
}

/**
 * Retrieves a temporary URL that can be used to download a submission file.
 *
 * @param submissionId - The unique identifier of the submission.
 * @returns API response containing a downloadable URL.
 */
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

/**
 * Retrieves stored test execution results for a submission.
 *
 * @param submissionId - The unique identifier of the submission.
 * @param includeHiddenDetails - Whether hidden test case details should be included.
 * @returns API response containing test result summary and itemized case outcomes.
 */
export async function getTestResultsForSubmissionById(
  submissionId: number,
  includeHiddenDetails: boolean = false,
): Promise<ApiResponse<TestResultsResponse>> {
  const includeHiddenDetailsQuery = includeHiddenDetails
    ? "?includeHiddenDetails=true"
    : ""

  return await apiClient.get(
    `/submissions/${submissionId}/test-results${includeHiddenDetailsQuery}`,
  )
}

/**
 * Triggers test execution for an existing submission and stores the new result.
 *
 * @param submissionId - The unique identifier of the submission.
 * @returns API response containing the updated test run result.
 */
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
 * Saves teacher feedback for a submission.
 *
 * @param submissionId - The submission ID
 * @param feedback - The feedback content
 * @returns API response with the updated submission
 */
export async function saveSubmissionFeedback(
  submissionId: number,
  feedback: string,
): Promise<
  ApiResponse<{ success: boolean; message: string; data: SubmissionDTO }>
> {
  return await apiClient.patch(`/submissions/${submissionId}/feedback`, {
    feedback,
  })
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

    lastUploadErrorMessage =
      uploadError.message || "Failed to upload assignment image"

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
  } catch {
    // Ignore storage cleanup failures because the asset may already be deleted.
  }
}

// Helper functions

/**
 * Resolves a safe file extension from filename or MIME type.
 *
 * @param file - Source image file.
 * @returns Lowercased extension compatible with storage naming.
 */
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

/**
 * Sanitizes a filename for storage path compatibility.
 *
 * @param fileName - Raw filename without extension.
 * @returns Normalized filename containing lowercase alphanumeric, hyphen, and underscore characters.
 */
function sanitizeFilename(fileName: string): string {
  const normalizedFileName = fileName.trim().toLowerCase()
  const sanitizedFileName = normalizedFileName.replace(/[^a-z0-9-_]/g, "-")
  const compactFileName = sanitizedFileName.replace(/-+/g, "-")
  return compactFileName || "assignment-instructions"
}

/**
 * Reads the configured assignment instructions bucket from environment variables.
 * Falls back to the default bucket when no valid value is provided.
 *
 * @returns Selected bucket name.
 */
function getConfiguredAssignmentInstructionsBucket(): string {
  const configuredBucketName = import.meta.env
    .VITE_SUPABASE_ASSIGNMENT_INSTRUCTIONS_BUCKET

  if (
    typeof configuredBucketName === "string" &&
    configuredBucketName.trim().length > 0
  ) {
    return configuredBucketName.trim()
  }

  return DEFAULT_ASSIGNMENT_INSTRUCTIONS_BUCKET
}

/**
 * Produces ordered unique bucket candidates for upload and delete operations.
 *
 * @param primaryBucketName - Primary bucket configured for assignment instructions.
 * @returns Deduplicated candidate bucket list.
 */
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

/**
 * Detects whether a storage error likely comes from missing bucket configuration or permissions.
 *
 * @param errorMessage - Raw storage error message.
 * @returns True when the error indicates bucket setup or authorization issues.
 */
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

/**
 * Parses a storage public URL into bucket and path components.
 * Supports absolute URLs, legacy patterns, and bucket/path direct strings.
 *
 * @param storagePublicUrl - Public storage URL or path-like value.
 * @returns Storage location tuple or null when parsing fails.
 */
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

  const legacyBucketLocation =
    parseStorageLocationFromLegacyPattern(storagePublicUrl)
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

/**
 * Parses Supabase absolute public storage URLs.
 *
 * @param storagePublicUrl - Absolute URL that may include /storage/v1/object/public/ marker.
 * @returns Parsed storage location or null when URL format does not match.
 */
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

/**
 * Parses legacy assignment image URL patterns by scanning known bucket names.
 *
 * @param storagePublicUrl - URL that may contain a bucket marker segment.
 * @returns Parsed storage location or null when no candidate bucket is found.
 */
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

/**
 * Retrieves the active Supabase access token from the current session.
 *
 * @returns Session access token or null when no authenticated session exists.
 */
async function retrieveAuthenticationTokenFromSession(): Promise<
  string | null
> {
  const { data: sessionData } = await supabase.auth.getSession()
  return sessionData.session?.access_token ?? null
}

/**
 * Builds multipart FormData payload used for assignment file submission.
 *
 * @param submissionRequest - Submission request object.
 * @returns FormData payload with assignment ID, student ID, and file.
 */
function buildSubmissionFormDataFromRequest(
  submissionRequest: SubmitAssignmentRequest,
): FormData {
  const formData = new FormData()
  formData.append("assignment_id", submissionRequest.assignmentId.toString())
  formData.append("student_id", submissionRequest.studentId.toString())
  formData.append("file", submissionRequest.file)
  return formData
}

/**
 * Extracts a human-readable error message from an unknown backend response shape.
 *
 * @param responseData - Raw response payload.
 * @returns Best-effort error message string.
 */
function extractErrorMessageFromResponseData(responseData: unknown): string {
  if (typeof responseData === "object" && responseData !== null) {
    const data = responseData as Record<string, unknown>
    if (data.detail && typeof data.detail === "string") return data.detail
    if (data.message && typeof data.message === "string") return data.message
  }
  if (typeof responseData === "string") return responseData
  return "Failed to submit assignment"
}

/**
 * Builds a normalized API error response for failed submission requests.
 *
 * @param httpResponse - Fetch response object.
 * @param responseData - Parsed response payload.
 * @returns Standardized ApiResponse error object with sanitized message and status.
 */
function buildErrorResponseForFailedSubmission(
  httpResponse: Response,
  responseData: unknown,
): ApiResponse<SubmitAssignmentResponse> {
  const errorMessage = extractErrorMessageFromResponseData(responseData)

  return {
    error: sanitizeUserFacingErrorMessage(errorMessage),
    status: httpResponse.status,
  }
}

/**
 * Validates and maps successful submission response payload into typed ApiResponse data.
 *
 * @param responseData - Raw success response payload.
 * @param httpStatusCode - HTTP status from the submission request.
 * @returns Standardized ApiResponse success object.
 * @throws Error when response payload is not an object.
 */
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
