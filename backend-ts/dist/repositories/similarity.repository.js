var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { eq, desc } from 'drizzle-orm';
import { similarityReports } from '@/models/similarity-report.model.js';
import { similarityResults } from '@/models/similarity-result.model.js';
import { matchFragments } from '@/models/match-fragment.model.js';
import { BaseRepository } from '@/repositories/base.repository.js';
import { injectable } from 'tsyringe';
/**
 * Repository for similarity report and result operations.
 */
let SimilarityRepository = class SimilarityRepository extends BaseRepository {
    constructor() {
        super(similarityReports);
    }
    /** Create a new similarity report */
    async createReport(data) {
        return this.create(data);
    }
    /** Get report by ID with results */
    async getReportById(reportId) {
        return this.findById(reportId);
    }
    /** Get all reports for an assignment */
    async getReportsByAssignment(assignmentId) {
        return await this.db
            .select()
            .from(similarityReports)
            .where(eq(similarityReports.assignmentId, assignmentId))
            .orderBy(desc(similarityReports.generatedAt));
    }
    /** Create similarity results (batch insert) */
    async createResults(results) {
        if (results.length === 0)
            return [];
        return await this.db
            .insert(similarityResults)
            .values(results)
            .returning();
    }
    /** Get results for a report */
    async getResultsByReport(reportId) {
        return await this.db
            .select()
            .from(similarityResults)
            .where(eq(similarityResults.reportId, reportId))
            .orderBy(desc(similarityResults.structuralScore));
    }
    /** Create match fragments (batch insert) */
    async createFragments(fragments) {
        if (fragments.length === 0)
            return [];
        return await this.db
            .insert(matchFragments)
            .values(fragments)
            .returning();
    }
    /** Get a specific result by ID */
    async getResultById(resultId) {
        const results = await this.db
            .select()
            .from(similarityResults)
            .where(eq(similarityResults.id, resultId))
            .limit(1);
        return results[0];
    }
    /** Delete a report (cascades to results) */
    async deleteReport(reportId) {
        return this.delete(reportId);
    }
    /** Get fragments for a specific result */
    async getFragmentsByResult(resultId) {
        return await this.db
            .select()
            .from(matchFragments)
            .where(eq(matchFragments.similarityResultId, resultId));
    }
    /** Get result with its fragments */
    async getResultWithFragments(resultId) {
        const result = await this.getResultById(resultId);
        if (!result)
            return null;
        const fragments = await this.getFragmentsByResult(resultId);
        return { result, fragments };
    }
};
SimilarityRepository = __decorate([
    injectable(),
    __metadata("design:paramtypes", [])
], SimilarityRepository);
export { SimilarityRepository };
//# sourceMappingURL=similarity.repository.js.map