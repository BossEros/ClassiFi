import type { Class } from "@/business/models/dashboard/types"

/**
 * Type guard to validate Class-like response objects.
 *
 * @param value - Unknown candidate value.
 * @returns True when the value matches required Class fields.
 */
export function isValidClass(value: unknown): value is Class {
  if (typeof value !== "object" || value === null) {
    console.warn("Invalid class: not an object or null", value)
    return false
  }

  const candidate = value as Record<string, unknown>

  const checks = {
    id: typeof candidate.id === "number",
    teacherId: typeof candidate.teacherId === "number",
    className: typeof candidate.className === "string",
    classCode: typeof candidate.classCode === "string",
    description:
      candidate.description === null ||
      typeof candidate.description === "string",
    isActive: typeof candidate.isActive === "boolean",
    createdAt: typeof candidate.createdAt === "string",
    yearLevel: typeof candidate.yearLevel === "number",
    semester: typeof candidate.semester === "number",
    academicYear: typeof candidate.academicYear === "string",
    schedule:
      typeof candidate.schedule === "object" && candidate.schedule !== null,
  }

  const isValid = Object.values(checks).every((passed) => passed === true)

  if (!isValid) {
    console.log("Invalid class object")
    console.log("Class data:", candidate)
    console.log("Validation checks:", checks)
    console.log(
      "Failed fields:",
      Object.entries(checks)
        .filter(([, passed]) => !passed)
        .map(([fieldName]) => fieldName),
    )
  }

  return isValid
}

/**
 * Safely maps unknown class array data to validated Class records.
 *
 * @param classes - Unknown class array payload.
 * @returns Valid Class array.
 */
export function mapToClassArray(classes: unknown[]): Class[] {
  return classes.filter(isValidClass)
}
