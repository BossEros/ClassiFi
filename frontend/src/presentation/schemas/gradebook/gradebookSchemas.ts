import { z } from "zod"

function parseGradeValue(gradeValue: string): number {
  return Number.parseFloat(gradeValue)
}

function isValidGradeFormat(gradeValue: string): boolean {
  if (gradeValue.trim() === "") return false
  const parsed = Number(gradeValue)
  return !Number.isNaN(parsed)
}

export function createGradeOverrideFormSchema(totalScore: number) {
  return z.object({
    grade: z
      .string()
      .refine((gradeValue) => gradeValue.trim() !== "", {
        message: "Please enter a valid grade",
      })
      .refine((gradeValue) => isValidGradeFormat(gradeValue), {
        message: "Grade must be a valid number",
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
      .refine((gradeValue) => gradeValue.trim() !== "", {
        message: "Please enter a valid grade",
      })
      .refine((gradeValue) => isValidGradeFormat(gradeValue), {
        message: "Grade must be a valid number",
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
