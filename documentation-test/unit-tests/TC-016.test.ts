/**
 * TC-016: Join Class Button Stays Disabled When Class Code Is Empty
 *
 * Module: Student Dashboard
 * Unit: Join class
 * Date Tested: 4/13/26
 * Description: Verify that the Join Class button stays disabled when the class code is empty.
 * Expected Result: The Join Class button remains disabled until a class code is entered.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-016 Unit Test Pass - Join Class Button Disabled With Empty Code
 * Suggested Figure Title (System UI): Student Dashboard UI - Join Class Button Disabled With Empty Code
 */

import { readFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const currentDirectory = dirname(fileURLToPath(import.meta.url))
const studentClassesPagePath = resolve(
  currentDirectory,
  "../../frontend/src/presentation/pages/student/StudentClassesPage.tsx",
)

describe("TC-016: Join Class Button Stays Disabled When Class Code Is Empty", () => {
  it("should keep the Join Class button disabled when the class code is blank", () => {
    const studentClassesPageSource = readFileSync(studentClassesPagePath, "utf8")

    expect(studentClassesPageSource).toContain('const classCodeValue = watch("classCode")')
    expect(studentClassesPageSource).toContain(
      'disabled={isSubmitting || !classCodeValue.trim()}',
    )
    expect(studentClassesPageSource).toContain("Join Class")
  })
})
