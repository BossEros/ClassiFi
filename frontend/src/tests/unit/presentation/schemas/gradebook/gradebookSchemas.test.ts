import { describe, expect, it } from "vitest"
import { createGradeOverrideFormSchema } from "@/presentation/schemas/gradebook/gradebookSchemas"

describe("gradebookSchemas", () => {
  it("accepts valid grade override values", () => {
    const schema = createGradeOverrideFormSchema(100)

    const parseResult = schema.safeParse({
      grade: "89.5",
      feedback: "Great improvement",
    })

    expect(parseResult.success).toBe(true)
  })

  it("rejects invalid grade value", () => {
    const schema = createGradeOverrideFormSchema(100)

    const parseResult = schema.safeParse({
      grade: "",
      feedback: "",
    })

    expect(parseResult.success).toBe(false)

    if (!parseResult.success) {
      expect(parseResult.error.issues[0]?.message).toBe(
        "Please enter a valid grade",
      )
    }
  })

  it("rejects out-of-range grade", () => {
    const schema = createGradeOverrideFormSchema(50)

    const parseResult = schema.safeParse({
      grade: "51",
      feedback: "",
    })

    expect(parseResult.success).toBe(false)

    if (!parseResult.success) {
      expect(parseResult.error.issues[0]?.message).toBe(
        "Grade must be between 0 and 50",
      )
    }
  })
})
