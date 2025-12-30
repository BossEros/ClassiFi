import { assignments, type Assignment, type NewAssignment } from '@/models/index.js';
import { BaseRepository } from '@/repositories/base.repository.js';
/** Programming language type */
export type ProgrammingLanguage = 'python' | 'java';
/**
 * Repository for assignment-related database operations.
 */
export declare class AssignmentRepository extends BaseRepository<typeof assignments, Assignment, NewAssignment> {
    constructor();
    /** Get an assignment by ID */
    getAssignmentById(assignmentId: number): Promise<Assignment | undefined>;
    /** Get all assignments for a class */
    getAssignmentsByClassId(classId: number, activeOnly?: boolean): Promise<Assignment[]>;
    /** Create a new assignment */
    createAssignment(data: {
        classId: number;
        assignmentName: string;
        description: string;
        programmingLanguage: ProgrammingLanguage;
        deadline: Date;
        allowResubmission?: boolean;
    }): Promise<Assignment>;
    /** Update an assignment */
    updateAssignment(assignmentId: number, data: Partial<Pick<NewAssignment, 'assignmentName' | 'description' | 'programmingLanguage' | 'deadline' | 'allowResubmission' | 'isActive'>>): Promise<Assignment | undefined>;
    /** Delete an assignment (hard delete) */
    deleteAssignment(assignmentId: number): Promise<boolean>;
    /** Deactivate an assignment (soft delete) */
    deactivateAssignment(assignmentId: number): Promise<Assignment | undefined>;
}
//# sourceMappingURL=assignment.repository.d.ts.map