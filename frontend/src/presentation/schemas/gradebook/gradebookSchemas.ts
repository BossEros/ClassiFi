import { z } from "zod"

function parseGradeValue(gradeValue: string): number {
  return Number.parseInt(gradeValue, 10)
}

function isWholeNumber(gradeValue: string): boolean {
  const parsed = Number(gradeValue)
  return !Number.isNaN(parsed) && Number.isInteger(parsed)
}

export function createGradeOverrideFormSchema(totalScore: number) {
  return z.object({
    grade: z
      .string()
      .refine((gradeValue) => isWholeNumber(gradeValue), {
        message: "Grade must be a whole number",
      })
      .refine(
        (gradeValue) => {
          const parsedGrade = parseGradeValue(gradeValue)
          return parsedGrade >= 0 && parsedGrade <= totalScore
        },
        {
          message: `Grade must be between 0 and ${totalScore}`,
        },
      ),
    feedback: z.string(),
  })
}

export type GradeOverrideFormValues = z.infer<
  ReturnType<typeof createGradeOverrideFormSchema>
>

export function createSetGradeFormSchema(totalScore: number) {
  return z.object({
    grade: z
      .string()
      .refine((gradeValue) => isWholeNumber(gradeValue), {
        message: "Grade must be a whole number",
      })
      .refine(
        (gradeValue) => {
          const parsedGrade = parseGradeValue(gradeValue)
          return parsedGrade >= 0 && parsedGrade <= totalScore
        },
        {
          message: `Grade must be between 0 and ${totalScore}`,
        },
      ),
  })
}

export type SetGradeFormValues = z.infer<ReturnType<typeof createSetGradeFormSchema>>
