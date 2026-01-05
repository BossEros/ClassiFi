import { similarityReports, type SimilarityReport, type NewSimilarityReport } from '@/models/similarity-report.model.js';
import { type SimilarityResult, type NewSimilarityResult } from '@/models/similarity-result.model.js';
import { type MatchFragment, type NewMatchFragment } from '@/models/match-fragment.model.js';
import { BaseRepository } from '@/repositories/base.repository.js';
/**
 * Repository for similarity report and result operations.
 */
export declare class SimilarityRepository extends BaseRepository<typeof similarityReports, SimilarityReport, NewSimilarityReport> {
    constructor();
    /** Create a new similarity report */
    createReport(data: NewSimilarityReport): Promise<SimilarityReport>;
    /** Get report by ID with results */
    getReportById(reportId: number): Promise<SimilarityReport | undefined>;
    /** Get all reports for an assignment */
    getReportsByAssignment(assignmentId: number): Promise<SimilarityReport[]>;
    /** Create similarity results (batch insert) */
    createResults(results: NewSimilarityResult[]): Promise<SimilarityResult[]>;
    /** Get results for a report */
    getResultsByReport(reportId: number): Promise<SimilarityResult[]>;
    /** Create match fragments (batch insert) */
    createFragments(fragments: NewMatchFragment[]): Promise<MatchFragment[]>;
    /** Get a specific result by ID */
    getResultById(resultId: number): Promise<SimilarityResult | undefined>;
    /** Delete a report (cascades to results) */
    deleteReport(reportId: number): Promise<boolean>;
    /** Get fragments for a specific result */
    getFragmentsByResult(resultId: number): Promise<MatchFragment[]>;
    /** Get result with its fragments */
    getResultWithFragments(resultId: number): Promise<{
        result: SimilarityResult;
        fragments: MatchFragment[];
    } | null>;
}
//# sourceMappingURL=similarity.repository.d.ts.map