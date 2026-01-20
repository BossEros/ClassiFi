import type { ValidationError, ValidationResult } from "@/shared/types/auth";

export interface Schedule {
  days: string[];
  startTime: string;
  endTime: string;
}

export interface CreateClassData {
  className: string;
  description: string;
  classCode?: string;
  yearLevel?: number;
  semester?: number;
  academicYear?: string;
  schedule?: Schedule;
}

/**
 * Validates class name
 * Requirements:
 * - Required field
 * - Minimum 1 character
 * - Maximum 100 characters
 */
export const validateClassName = (className: string): string | null => {
  const trimmed = className.trim();

  if (!trimmed) {
    return "Class name is required";
  }

  if (trimmed.length > 100) {
    return "Class name must not exceed 100 characters";
  }

  return null;
};

/**
 * Validates class description
 * Requirements:
 * - Optional field
 * - Maximum 1000 characters if provided
 */
export const validateClassDescription = (
  description: string,
): string | null => {
  const trimmed = description.trim();

  if (trimmed.length > 1000) {
    return "Description must not exceed 1000 characters";
  }

  return null;
};

/**
 * Validates class code for creation (basic check).
 * Requirements:
 * - Required field
 * - Must not be empty after trimming
 */
export const validateClassCode = (classCode: string): string | null => {
  if (!classCode || !classCode.trim()) {
    return "Class code is required";
  }
  return null;
};

/**
 * Validates class code used for joining a class.
 * Requirements:
 * - Required field
 * - Must be alphanumeric (letters and numbers only)
 * - Must be between 6-8 characters
 */
export const validateClassJoinCode = (classCode: string): string | null => {
  const trimmedCode = classCode ? classCode.trim() : "";

  if (!trimmedCode) {
    return "Class code is required";
  }

  const codeRegex = /^[A-Za-z0-9]{6,8}$/;
  if (!codeRegex.test(trimmedCode)) {
    return "Invalid class code format. Please enter a 6-8 character alphanumeric code.";
  }
  return null;
};

/**
 * Validates year level
 * Requirements:
 * - Must be 1, 2, 3, or 4
 */
export const validateYearLevel = (yearLevel: number): string | null => {
  if (![1, 2, 3, 4].includes(yearLevel)) {
    return "Year level must be 1, 2, 3, or 4";
  }
  return null;
};

/**
 * Validates semester
 * Requirements:
 * - Must be 1 or 2
 */
export const validateSemester = (semester: number): string | null => {
  if (![1, 2].includes(semester)) {
    return "Semester must be 1 or 2";
  }
  return null;
};

/**
 * Validates academic year
 * Requirements:
 * - Required field
 * - Format must be YYYY-YYYY (e.g., 2024-2025)
 * - End year must be exactly start year + 1
 */
export const validateAcademicYear = (academicYear: string): string | null => {
  if (!academicYear) {
    return "Academic year is required";
  }

  const pattern = /^\d{4}-\d{4}$/;
  if (!pattern.test(academicYear)) {
    return "Academic year must be in format YYYY-YYYY (e.g., 2024-2025)";
  }

  const [startYear, endYear] = academicYear.split("-").map(Number);
  if (endYear !== startYear + 1) {
    return "End year must be exactly one year after start year";
  }

  return null;
};

/**
 * Validates schedule
 * Requirements:
 * - Days array must not be empty
 * - Start time and end time are required
 */
export const validateSchedule = (
  schedule: Schedule | undefined,
): string | null => {
  if (!schedule) {
    return "Schedule is required";
  }

  if (!schedule.days || schedule.days.length === 0) {
    return "At least one schedule day is required";
  }

  if (!schedule.startTime) {
    return "Schedule start time is required";
  }

  if (!schedule.endTime) {
    return "Schedule end time is required";
  }

  // Time format validation (HH:mm)
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

  if (!timeRegex.test(schedule.startTime)) {
    return "Invalid time format for startTime";
  }

  if (!timeRegex.test(schedule.endTime)) {
    return "Invalid time format for endTime";
  }

  // Parse times to ensure end is after start
  const [startHour, startMinute] = schedule.startTime.split(":").map(Number);
  const [endHour, endMinute] = schedule.endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  if (endMinutes <= startMinutes) {
    return "Schedule end time must be after start time";
  }

  return null;
};

/**
 * Validates complete create class form data
 * Returns validation result with all errors
 */
export const validateCreateClassData = (
  data: CreateClassData,
): ValidationResult => {
  const errors: ValidationError[] = [];

  const classNameError = validateClassName(data.className);
  if (classNameError)
    errors.push({ field: "className", message: classNameError });

  const descriptionError = validateClassDescription(data.description);
  if (descriptionError)
    errors.push({ field: "description", message: descriptionError });

  if (data.classCode !== undefined) {
    const classCodeError = validateClassCode(data.classCode);
    if (classCodeError)
      errors.push({ field: "classCode", message: classCodeError });
  }

  if (data.yearLevel !== undefined) {
    const yearLevelError = validateYearLevel(data.yearLevel);
    if (yearLevelError)
      errors.push({ field: "yearLevel", message: yearLevelError });
  }

  if (data.semester !== undefined) {
    const semesterError = validateSemester(data.semester);
    if (semesterError)
      errors.push({ field: "semester", message: semesterError });
  }

  if (data.academicYear !== undefined) {
    const academicYearError = validateAcademicYear(data.academicYear);
    if (academicYearError)
      errors.push({ field: "academicYear", message: academicYearError });
  }

  if (data.schedule !== undefined) {
    const scheduleError = validateSchedule(data.schedule);
    if (scheduleError)
      errors.push({ field: "schedule", message: scheduleError });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates individual field for real-time validation
 * Used for showing errors as the user types or on blur
 */
export const validateClassField = (
  fieldName: string,
  value: string | number | Schedule,
): string | null => {
  switch (fieldName) {
    case "className":
      return validateClassName(value as string);
    case "description":
      return validateClassDescription(value as string);
    case "classCode":
      return validateClassCode(value as string);
    case "yearLevel":
      return validateYearLevel(value as number);
    case "semester":
      return validateSemester(value as number);
    case "academicYear":
      return validateAcademicYear(value as string);
    case "schedule":
      return validateSchedule(value as Schedule);
    default:
      return null;
  }
};
