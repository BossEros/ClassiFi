import type { ClassRepository } from "@/modules/classes/class.repository.js"
import type { Class } from "@/models/index.js"
import { ClassNotFoundError, NotClassOwnerError } from "@/shared/errors.js"

/**
 * Require a class to exist.
 * @throws {ClassNotFoundError} If class doesn't exist
 */
export async function requireClass(
  classRepo: ClassRepository,
  classId: number,
): Promise<Class> {
  const classData = await classRepo.getClassById(classId)

  if (!classData) {
    throw new ClassNotFoundError(classId)
  }

  return classData
}

/**
 * Require a class to exist and be owned by the teacher.
 * @throws {ClassNotFoundError} If class doesn't exist
 * @throws {NotClassOwnerError} If teacher doesn't own the class
 */
export async function requireClassOwnership(
  classRepo: ClassRepository,
  classId: number,
  teacherId: number,
): Promise<Class> {
  const classData = await requireClass(classRepo, classId)

  if (classData.teacherId !== teacherId) {
    throw new NotClassOwnerError()
  }

  return classData
}
