import { inject, injectable } from "tsyringe";
import { AssignmentRepository } from "../repositories/assignment.repository.js";
import { TestCaseRepository } from "../repositories/testCase.repository.js";
import { ClassRepository } from "../repositories/class.repository.js";
import { toAssignmentDTO, type AssignmentDTO } from "../shared/mappers.js";
import { requireClassOwnership } from "../shared/guards.js";
import { AssignmentNotFoundError } from "../shared/errors.js";

/**
 * Business logic for assignment-related operations.
 * Follows SRP - handles only assignment concerns.
 * Uses domain errors for exceptional conditions.
 */
@injectable()
export class AssignmentService {
  constructor(
    @inject("AssignmentRepository")
    private assignmentRepo: AssignmentRepository,
    @inject("ClassRepository") private classRepo: ClassRepository,
    @inject("TestCaseRepository") private testCaseRepo: TestCaseRepository
  ) {}

  /**
   * Create an assignment for a class.
   * Validates class ownership.
   */
  async createAssignment(
    classId: number,
    teacherId: number,
    data: {
      assignmentName: string;
      description: string;
      programmingLanguage: "python" | "java" | "c";
      deadline: Date;
      allowResubmission?: boolean;
      maxAttempts?: number | null;
      templateCode?: string | null;
      totalScore?: number;
      scheduledDate?: Date | null;
    }
  ): Promise<AssignmentDTO> {
    // Verify class exists and teacher owns it
    await requireClassOwnership(this.classRepo, classId, teacherId);

    const assignment = await this.assignmentRepo.createAssignment({
      classId,
      assignmentName: data.assignmentName,
      description: data.description,
      programmingLanguage: data.programmingLanguage,
      deadline: data.deadline,
      allowResubmission: data.allowResubmission,
      maxAttempts: data.maxAttempts,
      templateCode: data.templateCode,
      totalScore: data.totalScore,
      scheduledDate: data.scheduledDate,
    });

    return toAssignmentDTO(assignment);
  }

  /**
   * Get all assignments for a class.
   */
  async getClassAssignments(classId: number): Promise<AssignmentDTO[]> {
    const assignments = await this.assignmentRepo.getAssignmentsByClassId(
      classId
    );

    return assignments.map((a) => toAssignmentDTO(a));
  }

  /**
   * Get assignment details by ID.
   * Includes class name in the response.
   */
  async getAssignmentDetails(assignmentId: number): Promise<AssignmentDTO> {
    const assignment = await this.assignmentRepo.getAssignmentById(
      assignmentId
    );

    if (!assignment) {
      throw new AssignmentNotFoundError(assignmentId);
    }

    const classData = await this.classRepo.getClassById(assignment.classId);
    const testCases = await this.testCaseRepo.getByAssignmentId(assignmentId);

    return toAssignmentDTO(assignment, {
      className: classData?.className,
      testCases: testCases.map((tc) => ({
        id: tc.id,
        name: tc.name,
        isHidden: tc.isHidden,
        // Only include input/expectedOutput for non-hidden test cases
        input: tc.isHidden ? undefined : tc.input,
        expectedOutput: tc.isHidden ? undefined : tc.expectedOutput,
      })),
    });
  }

  /**
   * Update an assignment.
   * Validates class ownership.
   */
  async updateAssignment(
    assignmentId: number,
    teacherId: number,
    data: {
      assignmentName?: string;
      description?: string;
      programmingLanguage?: "python" | "java" | "c";
      deadline?: Date;
      allowResubmission?: boolean;
      maxAttempts?: number | null;
      templateCode?: string | null;
      totalScore?: number;
      scheduledDate?: Date | null;
    }
  ): Promise<AssignmentDTO> {
    const assignment = await this.assignmentRepo.getAssignmentById(
      assignmentId
    );

    if (!assignment) {
      throw new AssignmentNotFoundError(assignmentId);
    }

    // Verify teacher owns the class
    await requireClassOwnership(this.classRepo, assignment.classId, teacherId);

    const updatedAssignment = await this.assignmentRepo.updateAssignment(
      assignmentId,
      data
    );

    if (!updatedAssignment) {
      throw new AssignmentNotFoundError(assignmentId);
    }

    return toAssignmentDTO(updatedAssignment);
  }

  /**
   * Delete an assignment.
   * Validates class ownership.
   */
  async deleteAssignment(
    assignmentId: number,
    teacherId: number
  ): Promise<void> {
    const assignment = await this.assignmentRepo.getAssignmentById(
      assignmentId
    );

    if (!assignment) {
      throw new AssignmentNotFoundError(assignmentId);
    }

    // Verify teacher owns the class
    await requireClassOwnership(this.classRepo, assignment.classId, teacherId);

    await this.assignmentRepo.deleteAssignment(assignmentId);
  }

  /**
   * Get assignment by ID (without authorization check).
   * Used internally or for cases where auth is handled elsewhere.
   */
  async getAssignmentById(assignmentId: number): Promise<AssignmentDTO | null> {
    const assignment = await this.assignmentRepo.getAssignmentById(
      assignmentId
    );

    return assignment ? toAssignmentDTO(assignment) : null;
  }
}
