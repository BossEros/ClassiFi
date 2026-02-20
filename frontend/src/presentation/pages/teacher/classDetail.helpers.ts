import type { EnrolledStudent } from "@/business/models/dashboard/types"

export function filterStudentsByQuery(
  students: EnrolledStudent[],
  studentSearchQuery: string,
): EnrolledStudent[] {
  if (!studentSearchQuery.trim()) {
    return students
  }

  const query = studentSearchQuery.toLowerCase()

  return students.filter(
    (student) =>
      (student.fullName ?? "").toLowerCase().includes(query) ||
      (student.email ?? "").toLowerCase().includes(query) ||
      (student.firstName ?? "").toLowerCase().includes(query) ||
      (student.lastName ?? "").toLowerCase().includes(query),
  )
}
