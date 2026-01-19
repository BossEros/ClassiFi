/**
 * Class Validation Unit Tests
 * Tests for class form validation rules
 */
import { describe, it, expect } from 'vitest'
import {
    validateClassName,
    validateClassDescription,
    validateCreateClassData,
    validateClassField,
} from './classValidation'

describe('classValidation', () => {
    // ============ validateClassName Tests ============
    describe('validateClassName', () => {
        it('should return null for valid class name', () => {
            expect(validateClassName('Introduction to Programming')).toBeNull()
        })

        it('should return error for empty class name', () => {
            expect(validateClassName('')).toBe('Class name is required')
        })

        it('should return error for whitespace-only class name', () => {
            expect(validateClassName('   ')).toBe('Class name is required')
        })

        it('should return null for single character class name', () => {
            expect(validateClassName('A')).toBeNull()
        })

        it('should return null for 100 character class name', () => {
            const className = 'A'.repeat(100)
            expect(validateClassName(className)).toBeNull()
        })

        it('should return error for class name exceeding 100 characters', () => {
            const className = 'A'.repeat(101)
            expect(validateClassName(className)).toBe('Class name must not exceed 100 characters')
        })

        it('should trim whitespace and validate', () => {
            expect(validateClassName('  Valid Name  ')).toBeNull()
        })
    })

    // ============ validateClassDescription Tests ============
    describe('validateClassDescription', () => {
        it('should return null for valid description', () => {
            expect(validateClassDescription('This is a valid class description.')).toBeNull()
        })

        it('should return null for empty description (optional field)', () => {
            expect(validateClassDescription('')).toBeNull()
        })

        it('should return null for 1000 character description', () => {
            const description = 'A'.repeat(1000)
            expect(validateClassDescription(description)).toBeNull()
        })

        it('should return error for description exceeding 1000 characters', () => {
            const description = 'A'.repeat(1001)
            expect(validateClassDescription(description)).toBe('Description must not exceed 1000 characters')
        })

        it('should trim whitespace and validate', () => {
            expect(validateClassDescription('  Description  ')).toBeNull()
        })
    })

    // ============ validateCreateClassData Tests ============
    describe('validateCreateClassData', () => {
        it('should return valid result for correct data', () => {
            const result = validateCreateClassData({
                className: 'Data Structures',
                description: 'Learn about data structures and algorithms.',
            })

            expect(result.isValid).toBe(true)
            expect(Object.keys(result.errors)).toHaveLength(0)
        })

        it('should return valid result with empty description', () => {
            const result = validateCreateClassData({
                className: 'Programming 101',
                description: '',
            })

            expect(result.isValid).toBe(true)
        })

        it('should return errors for empty class name', () => {
            const result = validateCreateClassData({
                className: '',
                description: 'Some description',
            })

            expect(result.isValid).toBe(false)
            expect(result.errors.className).toBe('Class name is required')
        })

        it('should return multiple errors when all fields are invalid', () => {
            const result = validateCreateClassData({
                className: '',
                description: 'A'.repeat(1001),
            })

            expect(result.isValid).toBe(false)
            expect(result.errors.className).toBeDefined()
            expect(result.errors.description).toBeDefined()
        })
    })

    // ============ validateClassField Tests ============
    describe('validateClassField', () => {
        it('should validate className field', () => {
            expect(validateClassField('className', '')).toBe('Class name is required')
            expect(validateClassField('className', 'Valid')).toBeNull()
        })

        it('should validate description field', () => {
            expect(validateClassField('description', 'A'.repeat(1001))).toBe('Description must not exceed 1000 characters')
            expect(validateClassField('description', 'Valid')).toBeNull()
        })

        it('should return null for unknown field', () => {
            expect(validateClassField('unknownField', 'value')).toBeNull()
        })
    })
})
