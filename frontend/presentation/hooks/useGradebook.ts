import { useState, useCallback, useEffect } from "react";
import {
  getClassGradebook,
  getClassStatistics,
  getStudentGrades,
  getStudentClassGrades,
  getStudentRank,
  overrideGrade,
  removeGradeOverride,
  downloadGradebookCSV,
} from "@/data/repositories/gradebookRepository";
import type {
  ClassGradebook,
  ClassStatistics,
  StudentClassGrades,
  StudentRank,
} from "@/data/api/types";

// ============================================================================
// useClassGradebook Hook
// ============================================================================

/**
 * Hook for fetching and managing a class gradebook
 */
export function useClassGradebook(classId: number) {
  const [gradebook, setGradebook] = useState<ClassGradebook | null>(null);
  const [statistics, setStatistics] = useState<ClassStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGradebook = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [gradebookData, statsData] = await Promise.all([
        getClassGradebook(classId),
        getClassStatistics(classId),
      ]);
      setGradebook(gradebookData);
      setStatistics(statsData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load gradebook";
      setError(errorMessage);
      setGradebook(null);
      setStatistics(null);
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (classId > 0) {
      fetchGradebook();
    }
  }, [fetchGradebook, classId]);

  return {
    gradebook,
    statistics,
    isLoading,
    error,
    refetch: fetchGradebook,
  };
}

// ============================================================================
// useStudentGrades Hook
// ============================================================================

/**
 * Hook for fetching a student's grades
 */
export function useStudentGrades(studentId: number, classId?: number) {
  const [grades, setGrades] = useState<StudentClassGrades[]>([]);
  const [rank, setRank] = useState<StudentRank | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGrades = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (classId) {
        // Fetch grades for specific class with rank
        const [classGrades, rankData] = await Promise.all([
          getStudentClassGrades(studentId, classId),
          getStudentRank(studentId, classId),
        ]);
        setGrades(classGrades ? [classGrades] : []);
        setRank(rankData);
      } else {
        // Fetch all grades
        const allGrades = await getStudentGrades(studentId);
        setGrades(allGrades);
        setRank(null);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load grades";
      setError(errorMessage);
      setGrades([]);
      setRank(null);
    } finally {
      setIsLoading(false);
    }
  }, [studentId, classId]);

  useEffect(() => {
    if (studentId > 0) {
      fetchGrades();
    }
  }, [fetchGrades, studentId]);

  return {
    grades,
    rank,
    isLoading,
    error,
    refetch: fetchGrades,
  };
}

// ============================================================================
// useGradeOverride Hook
// ============================================================================

/**
 * Hook for managing grade overrides
 */
export function useGradeOverride(onSuccess?: () => void) {
  const [isOverriding, setIsOverriding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const override = useCallback(
    async (submissionId: number, grade: number, feedback?: string | null) => {
      try {
        setIsOverriding(true);
        setError(null);
        await overrideGrade(submissionId, grade, feedback);
        onSuccess?.();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to override grade";
        setError(errorMessage);
        throw err;
      } finally {
        setIsOverriding(false);
      }
    },
    [onSuccess]
  );

  const removeOverride = useCallback(
    async (submissionId: number) => {
      try {
        setIsOverriding(true);
        setError(null);
        await removeGradeOverride(submissionId);
        onSuccess?.();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to remove override";
        setError(errorMessage);
        throw err;
      } finally {
        setIsOverriding(false);
      }
    },
    [onSuccess]
  );

  return {
    override,
    removeOverride,
    isOverriding,
    error,
  };
}

// ============================================================================
// useGradebookExport Hook
// ============================================================================

/**
 * Hook for exporting gradebook to CSV
 */
export function useGradebookExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportCSV = useCallback(async (classId: number, filename?: string) => {
    try {
      setIsExporting(true);
      setError(null);
      await downloadGradebookCSV(classId, filename);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to export gradebook";
      setError(errorMessage);
      throw err;
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    exportCSV,
    isExporting,
    error,
  };
}
