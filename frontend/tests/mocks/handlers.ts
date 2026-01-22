/**
 * MSW Request Handlers
 *
 * Define mock API handlers for testing. These simulate backend responses
 * without making real network requests.
 *
 * @see https://mswjs.io/docs/basics/mocking-responses
 */
import { http, HttpResponse } from "msw";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export const handlers = [
  // ============================================================================
  // Auth Endpoints
  // ============================================================================

  http.post(`${API_BASE}/auth/login`, () => {
    return HttpResponse.json({
      success: true,
      token: "mock-access-token",
      user: {
        id: 1,
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "student",
      },
    });
  }),

  http.post(`${API_BASE}/auth/register`, async () => {
    return HttpResponse.json({
      success: true,
      message: "Registration successful",
      user: {
        id: 2,
        email: "newuser@example.com",
        firstName: "New",
        lastName: "User",
        role: "student",
      },
    });
  }),

  http.post(`${API_BASE}/auth/verify`, async () => {
    return HttpResponse.json({
      success: true,
      user: {
        id: 1,
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "student",
      },
    });
  }),

  http.post(`${API_BASE}/auth/forgot-password`, async () => {
    return HttpResponse.json({
      success: true,
      message: "Password reset email sent",
    });
  }),

  // ============================================================================
  // Class Endpoints
  // ============================================================================

  http.get(`${API_BASE}/classes`, async () => {
    return HttpResponse.json([
      {
        id: 1,
        name: "Introduction to Programming",
        code: "CS101",
        description: "Learn programming fundamentals",
        teacherId: 1,
        academicYear: "2024-2025",
        semester: "1st",
      },
      {
        id: 2,
        name: "Data Structures",
        code: "CS201",
        description: "Advanced data structures",
        teacherId: 1,
        academicYear: "2024-2025",
        semester: "1st",
      },
    ]);
  }),

  http.get(`${API_BASE}/classes/:classId`, async ({ params }) => {
    const { classId } = params;

    return HttpResponse.json({
      id: Number(classId),
      name: "Introduction to Programming",
      code: "CS101",
      description: "Learn programming fundamentals",
      teacherId: 1,
      academicYear: "2024-2025",
      semester: "1st",
    });
  }),

  http.post(`${API_BASE}/classes`, async () => {
    return HttpResponse.json({
      id: 3,
      name: "New Class",
      code: "NEW123",
      description: "A new class",
      teacherId: 1,
      academicYear: "2024-2025",
      semester: "1st",
    });
  }),

  http.post(`${API_BASE}/classes/generate-code`, async () => {
    return HttpResponse.json({ code: "ABC123" });
  }),

  // ============================================================================
  // Assignment Endpoints
  // ============================================================================

  http.get(`${API_BASE}/classes/:classId/assignments`, async () => {
    return HttpResponse.json([
      {
        id: 1,
        title: "Hello World",
        description: "Write your first program",
        classId: 1,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxScore: 100,
      },
    ]);
  }),

  http.get(`${API_BASE}/assignments/:assignmentId`, async ({ params }) => {
    const { assignmentId } = params;

    return HttpResponse.json({
      id: Number(assignmentId),
      title: "Hello World",
      description: "Write your first program",
      classId: 1,
      deadline: "2025-12-31T23:59:59.000Z",
      maxScore: 100,
    });
  }),

  // ============================================================================
  // User Endpoints
  // ============================================================================

  http.get(`${API_BASE}/user/me`, async () => {
    return HttpResponse.json({
      id: 1,
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      role: "student",
    });
  }),

  http.delete(`${API_BASE}/user/me`, async () => {
    return HttpResponse.json({
      success: true,
      message: "Account deleted",
    });
  }),

  // ============================================================================
  // Dashboard Endpoints
  // ============================================================================

  http.get(`${API_BASE}/dashboard/student`, async () => {
    return HttpResponse.json({
      enrolledClasses: 3,
      upcomingDeadlines: 2,
      recentSubmissions: 5,
      averageGrade: 85,
    });
  }),

  http.get(`${API_BASE}/dashboard/teacher`, async () => {
    return HttpResponse.json({
      totalClasses: 4,
      totalStudents: 120,
      pendingSubmissions: 15,
      averageClassGrade: 78,
    });
  }),
];
