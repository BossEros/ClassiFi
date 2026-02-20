export interface GradebookAssignmentDTO {
  id: number
  name: string
  totalScore: number
  deadline: string | null
}

export interface GradebookGradeDTO {
  assignmentId: number
  submissionId: number | null
  grade: number | null
  isOverridden: boolean
  submittedAt: string | null
}

export interface GradebookStudentDTO {
  id: number
  name: string
  email: string
  grades: GradebookGradeDTO[]
}

export interface ClassGradebookDTO {
  assignments: GradebookAssignmentDTO[]
  students: GradebookStudentDTO[]
}

export interface StudentGradeAssignmentDTO {
  assignmentId: number
  assignmentName: string
  totalScore: number
  deadline: string | null
  grade: number | null
  isOverridden: boolean
  feedback: string | null
  submittedAt: string | null
}

export interface StudentGradeClassDTO {
  classId: number
  className: string
  teacherName: string
  assignments: StudentGradeAssignmentDTO[]
}

export function toClassGradebookDTO(gradebook: {
  assignments: Array<{
    id: number
    name: string
    totalScore: number
    deadline: Date | null
  }>
  students: Array<{
    id: number
    name: string
    email: string
    grades: Array<{
      assignmentId: number
      submissionId: number | null
      grade: number | null
      isOverridden: boolean
      submittedAt: Date | null
    }>
  }>
}): ClassGradebookDTO {
  return {
    assignments: gradebook.assignments.map((a) => ({
      id: a.id,
      name: a.name,
      totalScore: a.totalScore,
      deadline: a.deadline?.toISOString() ?? null,
    })),
    students: gradebook.students.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      grades: s.grades.map((g) => ({
        assignmentId: g.assignmentId,
        submissionId: g.submissionId,
        grade: g.grade,
        isOverridden: g.isOverridden,
        submittedAt: g.submittedAt?.toISOString() ?? null,
      })),
    })),
  }
}

export function toStudentGradesDTO(
  grades: Array<{
    classId: number
    className: string
    teacherName: string
    assignments: Array<{
      assignmentId: number
      assignmentName: string
      totalScore: number
      deadline: Date | null
      grade: number | null
      isOverridden: boolean
      feedback: string | null
      submittedAt: Date | null
    }>
  }>,
): StudentGradeClassDTO[] {
  return grades.map((c) => ({
    classId: c.classId,
    className: c.className,
    teacherName: c.teacherName,
    assignments: c.assignments.map((a) => ({
      assignmentId: a.assignmentId,
      assignmentName: a.assignmentName,
      totalScore: a.totalScore,
      deadline: a.deadline?.toISOString() ?? null,
      grade: a.grade,
      isOverridden: a.isOverridden,
      feedback: a.feedback,
      submittedAt: a.submittedAt?.toISOString() ?? null,
    })),
  }))
}
