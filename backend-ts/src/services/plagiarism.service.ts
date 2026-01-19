import { inject, injectable } from "tsyringe";
import {
  File,
  LanguageName,
  Report,
  Pair,
  Fragment,
} from "../lib/plagiarism/index.js";
import { AssignmentRepository } from "../repositories/assignment.repository.js";
import { PlagiarismDetectorFactory } from "./plagiarism/plagiarism-detector.factory.js";
import { SubmissionFileService } from "./plagiarism/submission-file.service.js";
import { PlagiarismPersistenceService } from "./plagiarism/plagiarism-persistence.service.js";
import {
  PLAGIARISM_CONFIG,
  PLAGIARISM_LANGUAGE_MAP,
  toPlagiarismPairDTO,
  toPlagiarismFragmentDTO,
  type PlagiarismPairDTO,
  type PlagiarismFragmentDTO,
  type PlagiarismSummaryDTO,
} from "../shared/mappers.js";
import {
  AssignmentNotFoundError,
  PlagiarismReportNotFoundError,
  PlagiarismResultNotFoundError,
  PlagiarismPairNotFoundError,
  InsufficientFilesError,
  UnsupportedLanguageError,
  LanguageRequiredError,
} from "../shared/errors.js";
import type { MatchFragment } from "../models/index.js";

/** Request body for analyzing files */
export interface AnalyzeRequest {
  files: Array<{
    id?: string;
    path: string;
    content: string;
    studentId?: string;
    studentName?: string;
  }>;
  language: LanguageName;
  templateFile?: {
    path: string;
    content: string;
  };
  threshold?: number;
  kgramLength?: number;
}

/** Response for analyze endpoint */
export interface AnalyzeResponse {
  reportId: string;
  summary: PlagiarismSummaryDTO;
  pairs: PlagiarismPairDTO[];
  warnings: string[];
}

/** Response with pair details and fragments */
export interface PairDetailsResponse {
  pair: PlagiarismPairDTO;
  fragments: PlagiarismFragmentDTO[];
  leftCode: string;
  rightCode: string;
}

/**
 * Business logic for plagiarism detection operations.
 * Refactored to use dedicated services for persistence and file operations.
 */
@injectable()
export class PlagiarismService {
  private static readonly LEGACY_REPORT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly MAX_LEGACY_REPORTS = 100;

  /**
   * In-memory storage for ad-hoc reports (not tied to assignment submissions).
   * Kept for 'analyzeFiles' endpoint which might not persist to DB.
   */
  private legacyReportsStore = new Map<
    string,
    { report: Report; createdAt: Date }
  >();

  /** Interval ID for cleanup timer - stored to allow cleanup in dispose() */
  private cleanupIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    @inject("AssignmentRepository")
    private assignmentRepo: AssignmentRepository,
    @inject("PlagiarismDetectorFactory")
    private detectorFactory: PlagiarismDetectorFactory,
    @inject("SubmissionFileService") private fileService: SubmissionFileService,
    @inject("PlagiarismPersistenceService")
    private persistenceService: PlagiarismPersistenceService,
  ) {
    // Run cleanup every hour and store the interval ID for cleanup
    this.cleanupIntervalId = setInterval(
      () => this.cleanupExpiredReports(),
      60 * 60 * 1000,
    );
  }

  /**
   * Dispose of the service and clean up resources.
   * Should be called during application shutdown or test teardown.
   */
  public dispose(): void {
    if (this.cleanupIntervalId !== null) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
    this.legacyReportsStore.clear();
  }

  // ========================================================================
  // Public Methods
  // ========================================================================

  /** Analyze files for plagiarism (Ad-hoc analysis) */
  async analyzeFiles(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    // Validate request
    this.validateAnalyzeRequest(request);

    // Create detector using factory
    const detector = this.detectorFactory.create({
      language: request.language,
      kgramLength: request.kgramLength,
    });

    // Convert to File objects
    const files = request.files.map(
      (f) =>
        new File(f.path, f.content, {
          studentId: f.studentId,
          studentName: f.studentName,
        }),
    );

    // Optional template file
    const ignoredFile = request.templateFile
      ? new File(request.templateFile.path, request.templateFile.content)
      : undefined;

    // Run analysis
    const report = await detector.analyze(files, ignoredFile);

    // For ad-hoc analysis, we might still use in-memory store if it doesn't map to DB schema
    // Or we could persist it if we want ad-hoc history.
    // For now, preserving legacy behavior of generating a temporary ID.
    this.cleanupExpiredReports();
    const reportId = this.generateReportId();
    this.legacyReportsStore.set(reportId, { report, createdAt: new Date() });

    // Build response
    const threshold = request.threshold ?? PLAGIARISM_CONFIG.DEFAULT_THRESHOLD;
    const summary = report.getSummary();
    const pairs = report.getPairs();

    return {
      reportId,
      summary: {
        totalFiles: summary.totalFiles,
        totalPairs: summary.totalPairs,
        suspiciousPairs: pairs.filter((p) => p.similarity >= threshold).length,
        averageSimilarity: summary.averageSimilarity,
        maxSimilarity: summary.maxSimilarity,
      },
      pairs: pairs.map((pair) => toPlagiarismPairDTO(pair)),
      warnings: summary.warnings,
    };
  }

  /** Get pair details with fragments */
  async getPairDetails(
    reportId: string,
    pairId: number,
  ): Promise<PairDetailsResponse> {
    // Check for ad-hoc report first (legacy)
    const legacyStored = this.legacyReportsStore.get(reportId);

    if (legacyStored) {
      const pairs = legacyStored.report.getPairs();
      const pair = pairs.find((p: Pair) => p.id === pairId);
      if (!pair) {
        throw new PlagiarismPairNotFoundError(pairId);
      }
      const fragments = legacyStored.report.getFragments(pair);
      return {
        pair: toPlagiarismPairDTO(pair),
        fragments: fragments.map((f: Fragment, i: number) =>
          toPlagiarismFragmentDTO(f, i),
        ),
        leftCode: pair.leftFile.content,
        rightCode: pair.rightFile.content,
      };
    }

    // Try to handle as DB report
    const numericReportId = parseInt(reportId, 10);
    if (!isNaN(numericReportId)) {
      // Delegate to getResultDetails for DB-backed reports
      // pairId corresponds to the resultId in the database
      const details = await this.getResultDetails(pairId);

      return {
        pair: {
          id: details.result.id,
          leftFile: {
            id: details.result.submission1Id,
            path: details.leftFile.filename,
            filename: details.leftFile.filename,
            lineCount: details.leftFile.lineCount,
            studentName: details.leftFile.studentName,
          },
          rightFile: {
            id: details.result.submission2Id,
            path: details.rightFile.filename,
            filename: details.rightFile.filename,
            lineCount: details.rightFile.lineCount,
            studentName: details.rightFile.studentName,
          },
          structuralScore: parseFloat(details.result.structuralScore),
          semanticScore: 0,
          hybridScore: 0,
          overlap: details.result.overlap,
          longest: details.result.longestFragment,
        },
        fragments: details.fragments,
        leftCode: details.leftFile.content,
        rightCode: details.rightFile.content,
      };
    }

    throw new PlagiarismReportNotFoundError(reportId);
  }

  /** Get report by ID */
  async getReport(reportId: string): Promise<AnalyzeResponse | null> {
    // Try to parse as numeric ID (database report)
    const numericId = parseInt(reportId, 10);
    if (!isNaN(numericId)) {
      return this.persistenceService.getReport(numericId);
    }

    // Fall back to in-memory for string-based ad-hoc reports
    const stored = this.legacyReportsStore.get(reportId);
    if (!stored) {
      return null;
    }

    const summary = stored.report.getSummary();
    const pairs = stored.report.getPairs();
    const threshold = PLAGIARISM_CONFIG.DEFAULT_THRESHOLD;

    return {
      reportId,
      summary: {
        totalFiles: summary.totalFiles,
        totalPairs: summary.totalPairs,
        suspiciousPairs: pairs.filter((p: Pair) => p.similarity >= threshold)
          .length,
        averageSimilarity: summary.averageSimilarity,
        maxSimilarity: summary.maxSimilarity,
      },
      pairs: pairs.map((pair: Pair) => toPlagiarismPairDTO(pair)),
      warnings: summary.warnings,
    };
  }

  /** Delete a report */
  async deleteReport(reportId: string): Promise<boolean> {
    // Try to parse as numeric ID (database report)
    const numericId = parseInt(reportId, 10);
    if (!isNaN(numericId)) {
      return this.persistenceService.deleteReport(numericId);
    }

    // Fall back to in-memory for string-based ad-hoc reports
    return this.legacyReportsStore.delete(reportId);
  }

  /** Get result details from database with fragments and file content */
  async getResultDetails(resultId: number): Promise<{
    result: {
      id: number;
      submission1Id: number;
      submission2Id: number;
      structuralScore: string;
      overlap: number;
      longestFragment: number;
    };
    fragments: PlagiarismFragmentDTO[];
    leftFile: {
      filename: string;
      content: string;
      lineCount: number;
      studentName: string;
    };
    rightFile: {
      filename: string;
      content: string;
      lineCount: number;
      studentName: string;
    };
  }> {
    const data = await this.persistenceService.getResultData(resultId);

    if (!data || !data.submission1 || !data.submission2) {
      throw new PlagiarismResultNotFoundError(resultId);
    }

    const { result, fragments, submission1, submission2 } = data;

    // Download file content using File Service
    const [leftContent, rightContent] =
      await this.fileService.downloadSubmissionFiles(
        submission1.submission.filePath,
        submission2.submission.filePath,
      );

    return {
      result: {
        id: result.id,
        submission1Id: result.submission1Id,
        submission2Id: result.submission2Id,
        structuralScore: result.structuralScore,
        overlap: result.overlap,
        longestFragment: result.longestFragment,
      },
      fragments: fragments.map((f: MatchFragment) => ({
        id: f.id,
        leftSelection: {
          startRow: f.leftStartRow,
          startCol: f.leftStartCol,
          endRow: f.leftEndRow,
          endCol: f.leftEndCol,
        },
        rightSelection: {
          startRow: f.rightStartRow,
          startCol: f.rightStartCol,
          endRow: f.rightEndRow,
          endCol: f.rightEndCol,
        },
        length: f.length,
      })),
      leftFile: {
        filename: submission1.submission.fileName,
        content: leftContent,
        lineCount: leftContent.split("\n").length,
        studentName: submission1.studentName || "Unknown",
      },
      rightFile: {
        filename: submission2.submission.fileName,
        content: rightContent,
        lineCount: rightContent.split("\n").length,
        studentName: submission2.studentName || "Unknown",
      },
    };
  }

  /**
   * Analyze all submissions for an assignment.
   */
  async analyzeAssignmentSubmissions(
    assignmentId: number,
    teacherId?: number,
  ): Promise<AnalyzeResponse> {
    // Step 1: Validate and fetch assignment
    const assignment =
      await this.assignmentRepo.getAssignmentById(assignmentId);
    if (!assignment) {
      throw new AssignmentNotFoundError(assignmentId);
    }

    // Step 2: Fetch and download submission files
    const files = await this.fileService.fetchSubmissionFiles(assignmentId);

    // Step 3: Create ignored file from template code
    const language = this.getLanguage(assignment.programmingLanguage);
    let ignoredFile: File | undefined;
    if (assignment.templateCode) {
      ignoredFile = new File(
        `template.${this.getFileExtension(language)}`,
        assignment.templateCode,
      );
    }

    // Step 4: Run plagiarism analysis
    const detector = this.detectorFactory.create({ language });
    const report = await detector.analyze(files, ignoredFile);
    const pairs = report.getPairs();

    // Step 5: Persist report to database
    const { dbReport, resultIdMap } =
      await this.persistenceService.persistReport(
        assignmentId,
        teacherId,
        report,
        pairs,
      );

    // Step 6: Build and return response
    return this.buildAssignmentAnalysisResponse(
      dbReport.id,
      report,
      pairs,
      resultIdMap,
    );
  }

  // ========================================================================
  // Private Helper Methods
  // ========================================================================

  private cleanupExpiredReports() {
    const now = Date.now();

    // Remove expired entries
    for (const [id, data] of this.legacyReportsStore.entries()) {
      if (
        now - data.createdAt.getTime() >
        PlagiarismService.LEGACY_REPORT_TTL_MS
      ) {
        this.legacyReportsStore.delete(id);
      }
    }

    // Enforce max size (LRU-like: remove oldest if still too big)
    if (this.legacyReportsStore.size > PlagiarismService.MAX_LEGACY_REPORTS) {
      const sortedEntries = Array.from(this.legacyReportsStore.entries()).sort(
        (a, b) => a[1].createdAt.getTime() - b[1].createdAt.getTime(),
      );

      const toRemove =
        this.legacyReportsStore.size - PlagiarismService.MAX_LEGACY_REPORTS;
      for (let i = 0; i < toRemove; i++) {
        this.legacyReportsStore.delete(sortedEntries[i][0]);
      }
    }
  }

  private validateAnalyzeRequest(request: AnalyzeRequest): void {
    if (
      !request.files ||
      request.files.length < PLAGIARISM_CONFIG.MINIMUM_FILES_REQUIRED
    ) {
      throw new InsufficientFilesError(
        PLAGIARISM_CONFIG.MINIMUM_FILES_REQUIRED,
        request.files?.length ?? 0,
      );
    }

    if (!request.language) {
      throw new LanguageRequiredError();
    }
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private getLanguage(programmingLanguage: string): LanguageName {
    const language = PLAGIARISM_LANGUAGE_MAP[programmingLanguage.toLowerCase()];
    if (!language) {
      throw new UnsupportedLanguageError(programmingLanguage);
    }
    return language;
  }

  private getFileExtension(language: LanguageName): string {
    const extensionMap: Record<string, string> = {
      python: "py",
      java: "java",
      c: "c",
    };
    return extensionMap[language] || "txt";
  }

  private buildAssignmentAnalysisResponse(
    reportId: number,
    report: Report,
    pairs: Pair[],
    resultIdMap: Map<string, number>,
  ): AnalyzeResponse {
    return {
      reportId: reportId.toString(),
      summary: {
        totalFiles: report.files.length,
        totalPairs: pairs.length,
        suspiciousPairs: pairs.filter(
          (p: Pair) => p.similarity >= PLAGIARISM_CONFIG.DEFAULT_THRESHOLD,
        ).length,
        averageSimilarity: parseFloat(
          (
            pairs.reduce((sum: number, p: Pair) => sum + p.similarity, 0) /
            Math.max(1, pairs.length)
          ).toFixed(4),
        ),
        maxSimilarity: parseFloat(
          Math.max(...pairs.map((p: Pair) => p.similarity), 0).toFixed(4),
        ),
      },
      pairs: pairs.map((p: Pair) => {
        const leftSubId = parseInt(p.leftFile.info?.submissionId || "0");
        const rightSubId = parseInt(p.rightFile.info?.submissionId || "0");
        const [sub1, sub2] =
          leftSubId < rightSubId
            ? [leftSubId, rightSubId]
            : [rightSubId, leftSubId];
        const key = `${sub1}-${sub2}`;
        const resultId = resultIdMap.get(key) ?? 0;

        return {
          id: resultId,
          leftFile: {
            id: leftSubId,
            path: p.leftFile.path,
            filename: p.leftFile.filename,
            lineCount: p.leftFile.lineCount,
            studentId: p.leftFile.info?.studentId,
            studentName: p.leftFile.info?.studentName,
          },
          rightFile: {
            id: rightSubId,
            path: p.rightFile.path,
            filename: p.rightFile.filename,
            lineCount: p.rightFile.lineCount,
            studentId: p.rightFile.info?.studentId,
            studentName: p.rightFile.info?.studentName,
          },
          structuralScore: p.similarity,
          semanticScore: 0,
          hybridScore: 0,
          overlap: p.overlap,
          longest: p.longest,
        };
      }),
      warnings: [],
    };
  }
}
