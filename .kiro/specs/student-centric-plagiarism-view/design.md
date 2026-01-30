# Student-Centric Plagiarism Detection View - Design Document

## 1. Overview

This design document specifies the technical implementation for adding a student-centric view to the plagiarism detection results page. The feature will provide teachers with a primary interface focused on individual student originality scores, while maintaining the existing pairwise comparison view as an alternative.

### 1.1 Architecture Alignment

- **Backend**: Follows Controller-Service-Repository pattern
- **Frontend**: Follows Clean Architecture (Presentation → Business → Data)
- **Design System**: ClassiFi dark theme with teal accent colors
- **Code Standards**: SOLID principles, DRY, comprehensive documentation

### 1.2 Key Design Decisions

1. **Student-centric as default**: Research shows teachers primarily want to identify at-risk students first
2. **Preserve existing functionality**: Pairwise view remains fully functional for detailed analysis
3. **Originality score calculation**: `originality = 1 - max_similarity` provides intuitive metric
4. **Database-backed reports only**: Student summary only works with persisted reports (not ad-hoc)
5. **Reuse existing components**: Leverage PairComparison, SimilarityBadge, etc.

## 2. Data Model

### 2.1 New Interfaces

#### StudentSummary (Frontend & Backend DTO)
```typescript
interface StudentSummary {
  studentId: number
  studentName: string
  submissionId: number
  originalityScore: number  // 0-1 (1 = 100% original)
  highestSimilarity: number // 0-1 (highest match with any other student)
  highestMatchWith: {
    studentId: number
    studentName: string
    submissionId: number
  }
  totalPairs: number        // Total comparisons involving this student
  suspiciousPairs: number   // Pairs above threshold (default 0.7)
}
```

### 2.2 Existing Data Structures (No Changes)

- `PlagiarismPairDTO`: Existing pairwise comparison data
- `PlagiarismSummaryDTO`: Existing report summary
- `AnalyzeResponse`: Existing analysis response structure
- Database schema: No changes required

## 3. Backend Implementation

### 3.1 Service Layer: PlagiarismService

#### 3.1.1 New Method: getStudentSummary

**Location**: `backend-ts/src/services/plagiarism.service.ts`

**Signature**:
```typescript
async getStudentSummary(reportId: number): Promise<StudentSummary[]>
```

**Algorithm**:
1. Fetch report from database using `persistenceService.getReport(reportId)`
2. If report not found, throw `PlagiarismReportNotFoundError`
3. Extract all unique students from pairs (both leftFile and rightFile)
4. For each student:
   - Find all pairs where student appears (either side)
   - Calculate max similarity across their pairs
   - Calculate originality = 1 - max_similarity
   - Identify highest match (pair with max similarity)
   - Count total pairs and suspicious pairs (similarity >= threshold)
5. Sort by originality score (ascending) to show concerning students first
6. Return array of StudentSummary objects

**Error Handling**:
- Throw `PlagiarismReportNotFoundError` if report doesn't exist
- Throw `BadRequestError` if reportId is invalid
- Handle edge case: student with no pairs (originality = 1.0)

**JSDoc**:
```typescript
/**
 * Calculates per-student originality scores from pairwise similarity results.
 * Originality is computed as 1 - max_similarity, where max_similarity is the
 * highest similarity score across all pairs involving the student.
 *
 * @param reportId - The unique identifier of the plagiarism report.
 * @returns Array of student summaries sorted by originality (lowest first).
 * @throws PlagiarismReportNotFoundError if report doesn't exist.
 */
```

#### 3.1.2 New Method: getStudentPairs

**Location**: `backend-ts/src/services/plagiarism.service.ts`

**Signature**:
```typescript
async getStudentPairs(
  reportId: number,
  submissionId: number
): Promise<PlagiarismPairDTO[]>
```

**Algorithm**:
1. Fetch report from database using `persistenceService.getReport(reportId)`
2. If report not found, throw `PlagiarismReportNotFoundError`
3. Filter pairs where `leftFile.id === submissionId OR rightFile.id === submissionId`
4. Sort by similarity (descending) to show highest matches first
5. Return filtered array of PlagiarismPairDTO

**Error Handling**:
- Throw `PlagiarismReportNotFoundError` if report doesn't exist
- Throw `BadRequestError` if reportId or submissionId is invalid
- Return empty array if no pairs found (valid case)

**JSDoc**:
```typescript
/**
 * Retrieves all pairwise comparisons involving a specific student's submission.
 * Results are sorted by similarity score in descending order.
 *
 * @param reportId - The unique identifier of the plagiarism report.
 * @param submissionId - The unique identifier of the student's submission.
 * @returns Array of pairs involving the specified submission.
 * @throws PlagiarismReportNotFoundError if report doesn't exist.
 */
```

### 3.2 Controller Layer: plagiarism.controller.ts

#### 3.2.1 New Endpoint: GET /reports/:reportId/students


**Location**: `backend-ts/src/api/controllers/plagiarism.controller.ts`

**Route Configuration**:
```typescript
/**
 * GET /reports/:reportId/students
 * Get student-centric summary for a plagiarism report
 */
app.get<{ Params: { reportId: string } }>(
  "/reports/:reportId/students",
  {
    schema: {
      tags: ["Plagiarism"],
      summary: "Get student-centric summary for a plagiarism report",
      description: "Returns originality scores and statistics for all students in the report",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(ReportIdParamSchema),
      response: {
        200: toJsonSchema(StudentSummaryResponseSchema),
      },
    },
    preHandler: [authMiddleware],
    handler: async (request, reply) => {
      const reportId = parsePositiveInt(request.params.reportId, "Report ID")
      const students = await plagiarismService.getStudentSummary(reportId)
      
      return reply.send({
        success: true,
        message: "Student summary retrieved successfully",
        students,
      })
    },
  }
)
```

**Authentication**: Required (teacher only)
**Authorization**: Teacher must own the report or have access to the assignment

#### 3.2.2 New Endpoint: GET /reports/:reportId/students/:submissionId/pairs

**Location**: `backend-ts/src/api/controllers/plagiarism.controller.ts`

**Route Configuration**:
```typescript
/**
 * GET /reports/:reportId/students/:submissionId/pairs
 * Get all pairwise comparisons for a specific student
 */
app.get<{ Params: { reportId: string; submissionId: string } }>(
  "/reports/:reportId/students/:submissionId/pairs",
  {
    schema: {
      tags: ["Plagiarism"],
      summary: "Get all pairwise comparisons for a specific student",
      description: "Returns all similarity pairs involving the specified student's submission",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(StudentPairsParamsSchema),
      response: {
        200: toJsonSchema(StudentPairsResponseSchema),
      },
    },
    preHandler: [authMiddleware],
    handler: async (request, reply) => {
      const reportId = parsePositiveInt(request.params.reportId, "Report ID")
      const submissionId = parsePositiveInt(request.params.submissionId, "Submission ID")
      
      const pairs = await plagiarismService.getStudentPairs(reportId, submissionId)
      
      return reply.send({
        success: true,
        message: "Student pairs retrieved successfully",
        pairs,
      })
    },
  }
)
```

**Authentication**: Required (teacher only)
**Authorization**: Teacher must own the report or have access to the assignment

### 3.3 Schema Layer: plagiarism.schema.ts

**Location**: `backend-ts/src/api/schemas/plagiarism.schema.ts`

**New Schemas**:
```typescript
// Student summary response
export const StudentSummarySchema = z.object({
  studentId: z.number(),
  studentName: z.string(),
  submissionId: z.number(),
  originalityScore: z.number().min(0).max(1),
  highestSimilarity: z.number().min(0).max(1),
  highestMatchWith: z.object({
    studentId: z.number(),
    studentName: z.string(),
    submissionId: z.number(),
  }),
  totalPairs: z.number().int().nonnegative(),
  suspiciousPairs: z.number().int().nonnegative(),
})

export const StudentSummaryResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  students: z.array(StudentSummarySchema),
})

// Student pairs params
export const StudentPairsParamsSchema = z.object({
  reportId: z.string(),
  submissionId: z.string(),
})

export const StudentPairsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  pairs: z.array(PlagiarismPairSchema),
})

export type StudentSummary = z.infer<typeof StudentSummarySchema>
```

## 4. Frontend Implementation

### 4.1 Data Layer

#### 4.1.1 Repository: plagiarismRepository.ts


**Location**: `frontend/data/repositories/plagiarismRepository.ts`

**New Functions**:
```typescript
/**
 * Fetches student-centric summary for a plagiarism report.
 *
 * @param reportId - The unique identifier of the report.
 * @returns API response containing student summaries.
 */
export async function getStudentSummaryForReport(
  reportId: string
): Promise<ApiResponse<StudentSummary[]>> {
  try {
    const response = await apiClient.get<{
      success: boolean
      message: string
      students: StudentSummary[]
    }>(`/plagiarism/reports/${reportId}/students`)
    
    return { data: response.data.students, error: null }
  } catch (error) {
    return { data: null, error: handleApiError(error) }
  }
}

/**
 * Fetches all pairwise comparisons for a specific student's submission.
 *
 * @param reportId - The unique identifier of the report.
 * @param submissionId - The unique identifier of the student's submission.
 * @returns API response containing pairs involving the student.
 */
export async function getStudentPairs(
  reportId: string,
  submissionId: number
): Promise<ApiResponse<PairResponse[]>> {
  try {
    const response = await apiClient.get<{
      success: boolean
      message: string
      pairs: PairResponse[]
    }>(`/plagiarism/reports/${reportId}/students/${submissionId}/pairs`)
    
    return { data: response.data.pairs, error: null }
  } catch (error) {
    return { data: null, error: handleApiError(error) }
  }
}
```

#### 4.1.2 Types: data/api/types.ts

**Location**: `frontend/data/api/types.ts`

**New Type**:
```typescript
export interface StudentSummary {
  studentId: number
  studentName: string
  submissionId: number
  originalityScore: number
  highestSimilarity: number
  highestMatchWith: {
    studentId: number
    studentName: string
    submissionId: number
  }
  totalPairs: number
  suspiciousPairs: number
}
```

### 4.2 Business Layer

#### 4.2.1 Service: plagiarismService.ts

**Location**: `frontend/business/services/plagiarismService.ts`

**New Functions**:
```typescript
/**
 * Retrieves student-centric summary with originality scores for a report.
 * Validates the report ID before making the API call.
 *
 * @param reportId - The unique identifier of the plagiarism report.
 * @returns Array of student summaries with originality metrics.
 * @throws Error if the report cannot be fetched or validation fails.
 */
export async function getStudentSummary(
  reportId: string
): Promise<StudentSummary[]> {
  if (!reportId || reportId.trim() === "") {
    throw new Error("Report ID is required")
  }

  const response = await plagiarismRepository.getStudentSummaryForReport(reportId)

  if (response.error) {
    throw new Error(response.error)
  }

  if (!response.data) {
    throw new Error("Failed to fetch student summary")
  }

  return response.data
}

/**
 * Retrieves all pairwise comparisons involving a specific student's submission.
 * Validates inputs before making the API call.
 *
 * @param reportId - The unique identifier of the plagiarism report.
 * @param submissionId - The unique identifier of the student's submission.
 * @returns Array of pairs involving the specified student.
 * @throws Error if the pairs cannot be fetched or validation fails.
 */
export async function getStudentPairs(
  reportId: string,
  submissionId: number
): Promise<PairResponse[]> {
  if (!reportId || reportId.trim() === "") {
    throw new Error("Report ID is required")
  }

  validateId(submissionId, "submission")

  const response = await plagiarismRepository.getStudentPairs(reportId, submissionId)

  if (response.error) {
    throw new Error(response.error)
  }

  if (!response.data) {
    throw new Error("Failed to fetch student pairs")
  }

  return response.data
}
```

**Export Types**:
```typescript
export type { StudentSummary } from "@/data/api/types"
```

### 4.3 Presentation Layer

#### 4.3.1 Component: OriginalityBadge


**Location**: `frontend/presentation/components/plagiarism/OriginalityBadge.tsx`

**Purpose**: Display originality score with color-coded visual indicator

**Props**:
```typescript
interface OriginalityBadgeProps {
  originalityScore: number // 0-1
  showTooltip?: boolean
  size?: "sm" | "md" | "lg"
}
```

**Color Scheme**:
- Red (<0.3): `bg-red-500/20 text-red-400 border-red-500/30`
- Yellow (0.3-0.6): `bg-yellow-500/20 text-yellow-400 border-yellow-500/30`
- Green (>0.6): `bg-green-500/20 text-green-400 border-green-500/30`

**Tooltip Text**:
"Originality measures uniqueness compared to other submissions. Low originality may indicate similar approaches, not necessarily plagiarism."

**Implementation Pattern**: Similar to existing `SimilarityBadge` component

#### 4.3.2 Component: StudentSummaryTable

**Location**: `frontend/presentation/components/plagiarism/StudentSummaryTable.tsx`

**Purpose**: Display sortable, searchable table of students with originality scores

**Props**:
```typescript
interface StudentSummaryTableProps {
  students: StudentSummary[]
  onStudentSelect: (student: StudentSummary) => void
  selectedStudent?: StudentSummary | null
  isLoading?: boolean
}
```

**Features**:
1. **Sortable Columns**:
   - Student Name (alphabetical)
   - Originality Score (numerical)
   - Highest Similarity (numerical)
   - Default: Sort by originality (ascending) to show concerning students first

2. **Search/Filter**:
   - Search by student name (case-insensitive)
   - Real-time filtering as user types
   - Clear search button

3. **Pagination**:
   - 25 items per page
   - Page navigation controls
   - Show "X-Y of Z students"

4. **Table Columns**:
   - Student Name
   - Originality Score (with OriginalityBadge)
   - Highest Similarity (percentage)
   - Matched With (student name)
   - Total Pairs
   - Suspicious Pairs
   - Actions (View Details button)

5. **Visual Design**:
   - Hover effect on rows
   - Selected row highlight (teal-500/10)
   - Responsive layout (stack on mobile)
   - Loading skeleton state

**State Management**:
```typescript
const [searchQuery, setSearchQuery] = useState("")
const [sortBy, setSortBy] = useState<"name" | "originality" | "similarity">("originality")
const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
const [currentPage, setCurrentPage] = useState(1)
const itemsPerPage = 25
```

#### 4.3.3 Component: StudentPairsDetail

**Location**: `frontend/presentation/components/plagiarism/StudentPairsDetail.tsx`

**Purpose**: Show all pairwise comparisons for a selected student

**Props**:
```typescript
interface StudentPairsDetailProps {
  student: StudentSummary
  pairs: PairResponse[]
  onPairSelect: (pair: PairResponse) => void
  onBack: () => void
  isLoading?: boolean
}
```

**Layout**:
1. **Header Section**:
   - Back button (← Back to Students)
   - Student name (large, bold)
   - Originality badge (prominent)
   - Summary stats (total pairs, suspicious pairs)

2. **Pairs Table**:
   - Other Student Name
   - Similarity Score (with SimilarityBadge)
   - Overlap
   - Longest Match
   - Actions (Compare Code button)

3. **Visual Design**:
   - Card-based layout
   - Consistent with existing PairsTable styling
   - Hover effects on rows
   - Loading state for pairs

**State Management**:
```typescript
const [sortBy, setSortBy] = useState<"similarity" | "overlap" | "longest">("similarity")
const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
```

#### 4.3.4 Page: SimilarityResultsPage (Refactored)


**Location**: `frontend/presentation/pages/SimilarityResultsPage.tsx`

**New State Variables**:
```typescript
// View mode state
const [viewMode, setViewMode] = useState<"students" | "pairs">("students")

// Student-centric view state
const [students, setStudents] = useState<StudentSummary[]>([])
const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null)
const [studentPairs, setStudentPairs] = useState<PairResponse[]>([])
const [isLoadingStudents, setIsLoadingStudents] = useState(false)
const [isLoadingPairs, setIsLoadingPairs] = useState(false)
const [studentsError, setStudentsError] = useState<string | null>(null)
```

**Component Hierarchy**:
```
SimilarityResultsPage
├─ BackButton
├─ Header (title + report ID)
├─ Summary Cards (existing - shared by both views)
├─ View Toggle (Students | Pairs)
├─ Students View (viewMode === "students")
│  ├─ StudentSummaryTable (selectedStudent === null)
│  └─ StudentPairsDetail (selectedStudent !== null)
│     └─ Code Comparison (when pair selected)
└─ Pairs View (viewMode === "pairs")
   ├─ Search Input (existing)
   ├─ PairsTable (existing)
   └─ Code Comparison (existing)
```

**Data Fetching Logic**:
```typescript
// Fetch student summary when results are loaded
useEffect(() => {
  if (results && viewMode === "students" && students.length === 0) {
    fetchStudentSummary()
  }
}, [results, viewMode])

async function fetchStudentSummary() {
  setIsLoadingStudents(true)
  setStudentsError(null)
  
  try {
    const data = await plagiarismService.getStudentSummary(results.reportId)
    setStudents(data)
  } catch (error) {
    setStudentsError(error instanceof Error ? error.message : "Failed to load students")
  } finally {
    setIsLoadingStudents(false)
  }
}

// Fetch student pairs when a student is selected
async function handleStudentSelect(student: StudentSummary) {
  setSelectedStudent(student)
  setIsLoadingPairs(true)
  
  try {
    const pairs = await plagiarismService.getStudentPairs(
      results.reportId,
      student.submissionId
    )
    setStudentPairs(pairs)
  } catch (error) {
    console.error("Failed to fetch student pairs:", error)
    // Show error toast
  } finally {
    setIsLoadingPairs(false)
  }
}

function handleBackToStudents() {
  setSelectedStudent(null)
  setStudentPairs([])
}
```

**View Toggle Component**:
```typescript
<div className="flex justify-center mb-6">
  <div className="flex bg-black/20 backdrop-blur-md border border-white/5 rounded-xl p-1 gap-1">
    <button
      onClick={() => setViewMode("students")}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
        viewMode === "students"
          ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20"
          : "text-slate-300 hover:text-white hover:bg-white/5"
      }`}
    >
      <Users className="w-4 h-4" />
      Students View
    </button>
    <button
      onClick={() => setViewMode("pairs")}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
        viewMode === "pairs"
          ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20"
          : "text-slate-300 hover:text-white hover:bg-white/5"
      }`}
    >
      <GitCompare className="w-4 h-4" />
      Pairs View
    </button>
  </div>
</div>
```

**Conditional Rendering**:
```typescript
{viewMode === "students" && (
  <>
    {isLoadingStudents && <LoadingSpinner />}
    {studentsError && <ErrorMessage message={studentsError} />}
    {!selectedStudent && students.length > 0 && (
      <StudentSummaryTable
        students={students}
        onStudentSelect={handleStudentSelect}
        selectedStudent={selectedStudent}
      />
    )}
    {selectedStudent && (
      <StudentPairsDetail
        student={selectedStudent}
        pairs={studentPairs}
        onPairSelect={handleViewDetails}
        onBack={handleBackToStudents}
        isLoading={isLoadingPairs}
      />
    )}
  </>
)}

{viewMode === "pairs" && (
  <>
    {/* Existing pairs view implementation */}
    <SearchInput />
    <PairsTable />
  </>
)}

{/* Code comparison panel - shared by both views */}
{selectedPair && pairDetails && (
  <CodeComparisonPanel />
)}
```

## 5. Component Export Structure

**Location**: `frontend/presentation/components/plagiarism/index.ts`

**Updated Exports**:
```typescript
// Existing exports
export { SimilarityBadge } from "./SimilarityBadge"
export { PairComparison } from "./PairComparison"
export { PairCodeEditor } from "./PairCodeEditor"
export { PairCodeDiff } from "./PairCodeDiff"
export { FragmentsTable } from "./FragmentsTable"
export { PairsTable } from "./PairsTable"

// New exports
export { OriginalityBadge } from "./OriginalityBadge"
export { StudentSummaryTable } from "./StudentSummaryTable"
export { StudentPairsDetail } from "./StudentPairsDetail"

// Type exports
export type { FilePair } from "./types"
```

## 6. Error Handling Strategy

### 6.1 Backend Error Scenarios

| Scenario | Error Type | HTTP Status | Message |
|----------|-----------|-------------|---------|
| Report not found | PlagiarismReportNotFoundError | 404 | "Plagiarism report not found" |
| Invalid report ID | BadRequestError | 400 | "Invalid report ID" |
| Invalid submission ID | BadRequestError | 400 | "Invalid submission ID" |
| Unauthorized access | UnauthorizedError | 401 | "Authentication required" |
| No permission | ForbiddenError | 403 | "Access denied" |

### 6.2 Frontend Error Handling

1. **Network Errors**: Show toast notification with retry option
2. **Validation Errors**: Show inline error messages
3. **Not Found Errors**: Redirect to submissions page with error message
4. **Loading States**: Show skeleton loaders during data fetch
5. **Empty States**: Show helpful message when no data available

## 7. Performance Considerations

### 7.1 Backend Optimizations

1. **Database Queries**: Single query to fetch report with all pairs
2. **Calculation Caching**: Consider caching student summaries in memory for frequently accessed reports
3. **Pagination**: Implement pagination for large student lists (future enhancement)

### 7.2 Frontend Optimizations

1. **Lazy Loading**: Only fetch student summary when switching to students view
2. **Memoization**: Use `useMemo` for filtered/sorted data
3. **Debouncing**: Debounce search input (300ms)
4. **Virtual Scrolling**: Consider for very large student lists (future enhancement)

## 8. Testing Strategy


### 8.1 Backend Unit Tests

**Location**: `backend-ts/tests/services/plagiarism.service.test.ts`

**Test Cases**:
```typescript
describe("PlagiarismService.getStudentSummary", () => {
  it("should calculate originality scores correctly", async () => {
    // Test with known data: student with 0.8 max similarity should have 0.2 originality
  })

  it("should identify highest match correctly", async () => {
    // Test that highestMatchWith points to correct student
  })

  it("should handle student with no pairs", async () => {
    // Edge case: student with originality = 1.0
  })

  it("should sort by originality ascending", async () => {
    // Verify students with lowest originality appear first
  })

  it("should throw error for non-existent report", async () => {
    // Test error handling
  })

  it("should count suspicious pairs correctly", async () => {
    // Test threshold-based counting
  })
})

describe("PlagiarismService.getStudentPairs", () => {
  it("should return all pairs for a student", async () => {
    // Test filtering logic
  })

  it("should sort pairs by similarity descending", async () => {
    // Verify sort order
  })

  it("should return empty array for student with no pairs", async () => {
    // Edge case handling
  })

  it("should throw error for invalid submission ID", async () => {
    // Test validation
  })
})
```

### 8.2 Frontend Unit Tests

**Component Tests**:

1. **OriginalityBadge.test.tsx**:
   - Renders correct color for different score ranges
   - Shows tooltip on hover
   - Displays percentage correctly

2. **StudentSummaryTable.test.tsx**:
   - Renders student data correctly
   - Sorting works for all columns
   - Search filters students correctly
   - Pagination works correctly
   - Calls onStudentSelect when button clicked

3. **StudentPairsDetail.test.tsx**:
   - Renders student info correctly
   - Displays pairs table
   - Calls onBack when back button clicked
   - Calls onPairSelect when compare button clicked

**Service Tests**:

**Location**: `frontend/business/services/plagiarismService.test.ts`

```typescript
describe("plagiarismService.getStudentSummary", () => {
  it("should fetch student summary successfully", async () => {
    // Mock repository response
    // Verify service returns correct data
  })

  it("should throw error for empty report ID", async () => {
    // Test validation
  })

  it("should handle API errors gracefully", async () => {
    // Test error handling
  })
})

describe("plagiarismService.getStudentPairs", () => {
  it("should fetch student pairs successfully", async () => {
    // Mock repository response
    // Verify service returns correct data
  })

  it("should validate submission ID", async () => {
    // Test validation
  })
})
```

### 8.3 Integration Tests

**API Endpoint Tests**:

**Location**: `backend-ts/tests/api/plagiarism.controller.test.ts`

```typescript
describe("GET /plagiarism/reports/:reportId/students", () => {
  it("should return student summary for valid report", async () => {
    // Test successful response
  })

  it("should require authentication", async () => {
    // Test 401 response
  })

  it("should return 404 for non-existent report", async () => {
    // Test error handling
  })
})

describe("GET /plagiarism/reports/:reportId/students/:submissionId/pairs", () => {
  it("should return pairs for valid student", async () => {
    // Test successful response
  })

  it("should return empty array for student with no pairs", async () => {
    // Test edge case
  })
})
```

### 8.4 E2E Tests

**Location**: `frontend/tests/e2e/plagiarism.spec.ts`

**Test Scenarios**:
```typescript
test("Teacher can view student originality summary", async ({ page }) => {
  // 1. Login as teacher
  // 2. Navigate to assignment submissions
  // 3. Run plagiarism check
  // 4. Verify students view is default
  // 5. Verify student list displays
  // 6. Verify originality badges show correct colors
})

test("Teacher can drill down into student details", async ({ page }) => {
  // 1. From students view
  // 2. Click "View Details" on a student
  // 3. Verify student pairs display
  // 4. Click "Compare Code" on a pair
  // 5. Verify code comparison loads
  // 6. Click back button
  // 7. Verify returns to student list
})

test("Teacher can toggle between views", async ({ page }) => {
  // 1. Start in students view
  // 2. Click "Pairs View" toggle
  // 3. Verify pairs table displays
  // 4. Click "Students View" toggle
  // 5. Verify students table displays
  // 6. Verify state is preserved
})

test("Teacher can search and sort students", async ({ page }) => {
  // 1. In students view
  // 2. Type in search box
  // 3. Verify filtered results
  // 4. Click sort column
  // 5. Verify sort order changes
})
```

## 9. Documentation Updates

### 9.1 Backend Documentation

**Location**: `backend-ts/documentation.md`

**Section**: Plagiarism Detection API

**Add**:
```markdown
| Method | Endpoint                                              | Description                    |
| ------ | ----------------------------------------------------- | ------------------------------ |
| GET    | `/plagiarism/reports/:reportId/students`              | Get student originality summary|
| GET    | `/plagiarism/reports/:reportId/students/:submissionId/pairs` | Get student's pairs |

**Student-Centric Analysis**:

The plagiarism system provides a student-centric view that calculates originality scores:

- **Originality Score**: Calculated as `1 - max_similarity` where max_similarity is the highest similarity score across all pairs involving the student
- **Color Coding**: Red (<30%), Yellow (30-60%), Green (>60%)
- **Use Case**: Quickly identify students with potential plagiarism concerns

**Example Response**:
```json
{
  "success": true,
  "message": "Student summary retrieved successfully",
  "students": [
    {
      "studentId": 123,
      "studentName": "John Doe",
      "submissionId": 456,
      "originalityScore": 0.25,
      "highestSimilarity": 0.75,
      "highestMatchWith": {
        "studentId": 789,
        "studentName": "Jane Smith",
        "submissionId": 101
      },
      "totalPairs": 5,
      "suspiciousPairs": 2
    }
  ]
}
```
```

### 9.2 Frontend Documentation

**Location**: `frontend/documentation.md`

**Section**: Key Features > Plagiarism Detection

**Add**:
```markdown
### Student-Centric View

The plagiarism detection system provides two complementary views:

1. **Students View (Default)**:
   - Lists all students with originality scores
   - Color-coded badges (red/yellow/green)
   - Sortable by name, originality, or similarity
   - Searchable by student name
   - Drill-down to individual student details

2. **Pairs View**:
   - Traditional pairwise comparison table
   - Shows all similarity pairs
   - Sortable by similarity, overlap, longest match

**Originality Score**: Measures uniqueness (0-100%). Calculated as `100 * (1 - max_similarity)` where max_similarity is the highest match with any other student.

**Workflow**:
1. Run plagiarism check on assignment
2. View student originality summary (default)
3. Click "View Details" on concerning students
4. Review their pairwise comparisons
5. Click "Compare Code" to see side-by-side diff
6. Toggle to "Pairs View" for traditional analysis
```

## 10. Migration and Rollout Plan

### 10.1 Phase 1: Backend Implementation
- Implement service methods
- Add API endpoints
- Add schemas and validation
- Write unit tests
- Update API documentation

### 10.2 Phase 2: Frontend Data Layer
- Add repository functions
- Add type definitions
- Update service layer
- Write service tests

### 10.3 Phase 3: Frontend Components
- Create OriginalityBadge
- Create StudentSummaryTable
- Create StudentPairsDetail
- Write component tests

### 10.4 Phase 4: Page Integration
- Refactor SimilarityResultsPage
- Add view toggle
- Integrate new components
- Preserve existing functionality
- Write integration tests

### 10.5 Phase 5: Testing and Polish
- Run E2E tests
- Performance testing
- Accessibility audit
- UI/UX polish
- Documentation review

### 10.6 Phase 6: Deployment
- Deploy backend changes
- Deploy frontend changes
- Monitor for errors
- Gather user feedback

## 11. Future Enhancements

1. **CSV Export**: Export student originality report to CSV
2. **Filtering**: Filter students by originality score ranges
3. **Historical Tracking**: Track originality trends across multiple assignments
4. **Automated Flagging**: Automatically flag students below threshold
5. **Bulk Actions**: Select multiple students for batch operations
6. **Advanced Analytics**: Visualizations (charts, graphs) for originality distribution
7. **Comparison Across Assignments**: Compare student originality across multiple assignments

## 12. Acceptance Criteria Summary

✅ **Backend**:
- [ ] `getStudentSummary` method calculates originality correctly
- [ ] `getStudentPairs` method filters pairs correctly
- [ ] API endpoints return correct data with proper schemas
- [ ] All endpoints have authentication and authorization
- [ ] Comprehensive JSDoc and Swagger documentation
- [ ] Unit tests pass with >80% coverage

✅ **Frontend**:
- [ ] OriginalityBadge displays correct colors and tooltips
- [ ] StudentSummaryTable sorts, searches, and paginates correctly
- [ ] StudentPairsDetail shows all pairs for selected student
- [ ] View toggle switches between students and pairs views
- [ ] Students view is default on page load
- [ ] Existing pairs view functionality preserved
- [ ] Code comparison works from both views
- [ ] Loading states and error handling implemented
- [ ] Component tests pass
- [ ] E2E tests pass

✅ **Quality**:
- [ ] Code follows AGENTS.md guidelines
- [ ] TypeScript strict mode enabled, no `any` types
- [ ] All functions have JSDoc documentation
- [ ] Responsive design works on mobile
- [ ] Accessibility requirements met (ARIA, keyboard nav)
- [ ] Performance targets met (<2s for 100 students)

## 13. Glossary

- **Originality Score**: Metric representing uniqueness (1 - max_similarity)
- **Max Similarity**: Highest similarity score across all pairs for a student
- **Suspicious Pair**: Pair with similarity above threshold (default 70%)
- **Student-Centric View**: UI focused on individual student originality
- **Pairwise View**: UI focused on comparing pairs of submissions
- **Drill-Down**: Navigate from summary to detailed view
