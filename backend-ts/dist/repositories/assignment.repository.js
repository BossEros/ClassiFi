var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { eq, and, desc } from 'drizzle-orm';
import { assignments } from '@/models/index.js';
import { BaseRepository } from '@/repositories/base.repository.js';
import { injectable } from 'tsyringe';
/**
 * Repository for assignment-related database operations.
 */
let AssignmentRepository = class AssignmentRepository extends BaseRepository {
    constructor() {
        super(assignments);
    }
    /** Get an assignment by ID */
    async getAssignmentById(assignmentId) {
        return await this.findById(assignmentId);
    }
    /** Get all assignments for a class */
    async getAssignmentsByClassId(classId, activeOnly = true) {
        if (activeOnly) {
            return await this.db
                .select()
                .from(assignments)
                .where(and(eq(assignments.classId, classId), eq(assignments.isActive, true)))
                .orderBy(desc(assignments.deadline));
        }
        return await this.db
            .select()
            .from(assignments)
            .where(eq(assignments.classId, classId))
            .orderBy(desc(assignments.deadline));
    }
    /** Create a new assignment */
    async createAssignment(data) {
        const results = await this.db
            .insert(assignments)
            .values({
            classId: data.classId,
            assignmentName: data.assignmentName,
            description: data.description,
            programmingLanguage: data.programmingLanguage,
            deadline: data.deadline,
            allowResubmission: data.allowResubmission ?? true,
            isActive: true,
        })
            .returning();
        return results[0];
    }
    /** Update an assignment */
    async updateAssignment(assignmentId, data) {
        const updateData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
        if (Object.keys(updateData).length === 0) {
            return await this.getAssignmentById(assignmentId);
        }
        return await this.update(assignmentId, updateData);
    }
    /** Delete an assignment (hard delete) */
    async deleteAssignment(assignmentId) {
        return await this.delete(assignmentId);
    }
    /** Deactivate an assignment (soft delete) */
    async deactivateAssignment(assignmentId) {
        return await this.update(assignmentId, { isActive: false });
    }
};
AssignmentRepository = __decorate([
    injectable(),
    __metadata("design:paramtypes", [])
], AssignmentRepository);
export { AssignmentRepository };
//# sourceMappingURL=assignment.repository.js.map