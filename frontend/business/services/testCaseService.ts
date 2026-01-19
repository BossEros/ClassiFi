import * as testCaseRepository from '@/data/repositories/testCaseRepository'
import { validateId } from '@/shared/utils/validators'
import type {
    TestCase,
    CreateTestCaseRequest,
    UpdateTestCaseRequest,
    TestExecutionSummary,
} from '@/shared/types/testCase'

/**
 * Gets all test cases for an assignment
 *
 * @param assignmentId - ID of the assignment
 * @returns List of test cases
 */
export async function getTestCases(assignmentId: number): Promise<TestCase[]> {
    validateId(assignmentId, 'assignment')

    const response = await testCaseRepository.getTestCases(assignmentId)

    if (response.error) {
        throw new Error(response.error)
    }

    if (!response.data || !response.data.testCases) {
        throw new Error('Failed to fetch test cases')
    }

    return response.data.testCases
}

/**
 * Creates a new test case
 *
 * @param assignmentId - ID of the assignment
 * @param data - Test case data
 * @returns Created test case
 */
export async function createTestCase(
    assignmentId: number,
    data: CreateTestCaseRequest
): Promise<TestCase> {
    validateId(assignmentId, 'assignment')

    if (!data.name) throw new Error('Test case name is required')
    if (!data.input && data.input !== '') throw new Error('Input is required')
    if (!data.expectedOutput && data.expectedOutput !== '') throw new Error('Expected output is required')

    const response = await testCaseRepository.createTestCase(assignmentId, data)

    if (response.error) {
        throw new Error(response.error)
    }

    if (!response.data || !response.data.testCase) {
        throw new Error('Failed to create test case')
    }

    return response.data.testCase
}

/**
 * Updates an existing test case
 *
 * @param testCaseId - ID of the test case
 * @param data - Updated test case data
 * @returns Updated test case
 */
export async function updateTestCase(
    testCaseId: number,
    data: UpdateTestCaseRequest
): Promise<TestCase> {
    validateId(testCaseId, 'test case')

    const response = await testCaseRepository.updateTestCase(testCaseId, data)

    if (response.error) {
        throw new Error(response.error)
    }

    if (!response.data || !response.data.testCase) {
        throw new Error('Failed to update test case')
    }

    return response.data.testCase
}

/**
 * Deletes a test case
 *
 * @param testCaseId - ID of the test case
 */
export async function deleteTestCase(testCaseId: number): Promise<void> {
    validateId(testCaseId, 'test case')

    const response = await testCaseRepository.deleteTestCase(testCaseId)

    if (response.error) {
        throw new Error(response.error)
    }

    if (!response.data || !response.data.success) {
        throw new Error('Failed to delete test case')
    }
}

/**
 * Gets test results for a submission
 *
 * @param submissionId - ID of the submission
 * @returns Test execution summary or null
 */
export async function getTestResults(submissionId: number): Promise<TestExecutionSummary | null> {
    validateId(submissionId, 'submission')

    const response = await testCaseRepository.getTestResults(submissionId)

    if (response.error) {
        // If error indicates not found (404), return null to match previous behavior
        // But since we don't have status codes easily, we might throw.
        // However, looking at the previous consumer (TestResultsPanel), it treated error as "no results".
        // Let's rely on data presence.
        // If it's a "Not found" error, we might want to return null.
        // For now, let's throw to be standard, and handle in the hook or strict service pattern.
        // Actually, if I throw, the consumer handles it.
        throw new Error(response.error)
    }

    if (!response.data) {
        throw new Error('Failed to fetch test results')
    }

    return response.data.data || null
}
