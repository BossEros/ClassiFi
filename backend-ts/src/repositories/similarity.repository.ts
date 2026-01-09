import { db } from '@/shared/database.js';
import { eq, desc } from 'drizzle-orm';
import { similarityReports, type SimilarityReport, type NewSimilarityReport } from '@/models/similarity-report.model.js';
import { similarityResults, type SimilarityResult, type NewSimilarityResult } from '@/models/similarity-result.model.js';
import { matchFragments, type MatchFragment, type NewMatchFragment } from '@/models/match-fragment.model.js';
import { BaseRepository } from '@/repositories/base.repository.js';
import { injectable } from 'tsyringe';

/**
 * Repository for similarity report and result operations.
 */
@injectable()
export class SimilarityRepository extends BaseRepository<typeof similarityReports, SimilarityReport, NewSimilarityReport> {
    constructor() {
        super(similarityReports);
    }

    /** Create a new similarity report */
    async createReport(data: NewSimilarityReport): Promise<SimilarityReport> {
        return this.create(data);
    }

    /** Get report by ID with results */
    async getReportById(reportId: number): Promise<SimilarityReport | undefined> {
        return this.findById(reportId);
    }

    /** Get all reports for an assignment */
    async getReportsByAssignment(assignmentId: number): Promise<SimilarityReport[]> {
        return await this.db
            .select()
            .from(similarityReports)
            .where(eq(similarityReports.assignmentId, assignmentId))
            .orderBy(desc(similarityReports.generatedAt));
    }

    /** Create similarity results (batch insert) */
    async createResults(results: NewSimilarityResult[]): Promise<SimilarityResult[]> {
        if (results.length === 0) return [];

        return await this.db
            .insert(similarityResults)
            .values(results)
            .returning();
    }

    /** Get results for a report */
    async getResultsByReport(reportId: number): Promise<SimilarityResult[]> {
        return await this.db
            .select()
            .from(similarityResults)
            .where(eq(similarityResults.reportId, reportId))

            .orderBy(desc(similarityResults.structuralScore));
    }

    /** Create match fragments (batch insert) */
    async createFragments(fragments: NewMatchFragment[]): Promise<MatchFragment[]> {
        if (fragments.length === 0) return [];

        return await this.db
            .insert(matchFragments)
            .values(fragments)
            .returning();
    }

    /** Get a specific result by ID */
    async getResultById(resultId: number): Promise<SimilarityResult | undefined> {
        const results = await this.db
            .select()
            .from(similarityResults)
            .where(eq(similarityResults.id, resultId))
            .limit(1);

        return results[0];
    }

    /** Delete a report (cascades to results) */
    async deleteReport(reportId: number): Promise<boolean> {
        return this.delete(reportId);
    }

    /** Get fragments for a specific result */
    async getFragmentsByResult(resultId: number): Promise<MatchFragment[]> {
        return await this.db
            .select()
            .from(matchFragments)
            .where(eq(matchFragments.similarityResultId, resultId));
    }

    /** Get result with its fragments */
    async getResultWithFragments(resultId: number): Promise<{
        result: SimilarityResult;
        fragments: MatchFragment[];
    } | null> {
        const result = await this.getResultById(resultId);
        if (!result) return null;

        const fragments = await this.getFragmentsByResult(resultId);
        return { result, fragments };
    }

    /**
     * Get total report count.
     * Used for admin analytics dashboard.
     */
    async getReportCount(): Promise<number> {
        const { count } = await import('drizzle-orm');
        const result = await this.db
            .select({ count: count() })
            .from(similarityReports);
        return Number(result[0]?.count ?? 0);
    }
}

