import { v4 as uuidv4 } from "uuid"
import type { ClassRepository } from "@/modules/classes/class.repository.js"

/**
 * Generate a unique class code.
 * Creates an 8-character uppercase alphanumeric code and verifies uniqueness.
 *
 * @param classRepo - ClassRepository instance to check for existing codes
 * @returns A unique class code
 */
export async function generateUniqueClassCode(
  classRepo: ClassRepository,
): Promise<string> {
  let code: string
  let exists = true

  while (exists) {
    code = uuidv4().substring(0, 8).toUpperCase()
    exists = await classRepo.checkClassCodeExists(code)
  }

  return code!
}
