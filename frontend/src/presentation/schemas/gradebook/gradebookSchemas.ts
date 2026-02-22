import { z } from "zod"

function parseGradeValue(gradeValue: string): number {
  return Number.parseFloat(gradeValue)
}

export function createGradeOverrideFormSchema(totalScore: number) {
  return z.object({
    grade: z
      .string()
      .refine((gradeValue) => !Number.isNaN(parseGradeValue(gradeValue)), {
        message: "Please enter a valid grade",
      })
      .refine((gradeValue) => {
        const parsedGrade = parseGradeValue(gradeValue)
        return parsedGrade >= 0 && parsedGrade <= totalScore
      }, {
        message: `Grade must be between 0 and ${totalScore}`,
      }),
    feedback: z.string(),
  })
}

export type GradeOverrideFormValues = z.infer<
  ReturnType<typeof createGradeOverrideFormSchema>
>
