import type { AssignmentFormValues } from "@/presentation/schemas/assignment/assignmentSchemas"

/**
 * Runtime form data type alias derived from the Zod schema.
 * Use AssignmentFormValues (the Zod-inferred type) as the single source of truth.
 */
export type AssignmentFormData = AssignmentFormValues

export interface FormErrors {
  assignmentName?: string
  instructions?: string
  programmingLanguage?: string
  deadline?: string
  scheduledDate?: string
  totalScore?: string
  maxAttempts?: string
  general?: string
}

export type AssignmentFormInputChangeHandler = <
  K extends keyof AssignmentFormData,
>(
  field: K,
  value: AssignmentFormData[K],
) => void
