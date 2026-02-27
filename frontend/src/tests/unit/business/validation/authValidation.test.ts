import { describe, it, expect } from "vitest"
import type { RegisterRequest } from "@/shared/types/auth"
import {
  validateEmail,
  validateField,
  validateLoginData,
  validatePassword,
  validatePasswordsMatch,
  validateFirstName,
  validateLastName,
  validateRole,
  validateRegistrationData,
} from "@/business/validation/authValidation"

describe("Auth Validation", () => {
  describe("validateEmail", () => {
    it("should return error for empty email", () => {
      expect(validateEmail("")).toBe("Email is required")
    })

    it("should return error for invalid email format", () => {
      expect(validateEmail("invalid-email")).toBe(
        "Please enter a valid email address",
      )
    })

    it("should return null for valid email", () => {
      expect(validateEmail("test@example.com")).toBeNull()
    })
  })

  describe("validatePassword", () => {
    it("should return error for empty password", () => {
      expect(validatePassword("")).toBe("Password is required")
    })

    it("should return error for short password", () => {
      expect(validatePassword("short")).toBe(
        "Password must be at least 8 characters long",
      )
    })

    it("should return error for missing uppercase", () => {
      expect(validatePassword("lowercaseonly1!")).toBe(
        "Password must contain at least one uppercase letter",
      )
    })

    it("should return error for missing lowercase", () => {
      expect(validatePassword("UPPERCASEONLY1!")).toBe(
        "Password must contain at least one lowercase letter",
      )
    })

    it("should return error for missing number", () => {
      expect(validatePassword("NoNumber!")).toBe(
        "Password must contain at least one number",
      )
    })

    it("should return error for missing special char", () => {
      expect(validatePassword("NoSpecialChar1")).toBe(
        'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)',
      )
    })

    it("should return null for valid password", () => {
      expect(validatePassword("ValidPass1!")).toBeNull()
    })
  })

  describe("validatePasswordsMatch", () => {
    it("should return error for empty confirm password", () => {
      expect(validatePasswordsMatch("password", "")).toBe(
        "Please confirm your password",
      )
    })

    it("should return error for mismatching passwords", () => {
      expect(validatePasswordsMatch("password", "different")).toBe(
        "Passwords do not match",
      )
    })

    it("should return null for matching passwords", () => {
      expect(validatePasswordsMatch("password", "password")).toBeNull()
    })
  })

  describe("validateFirstName", () => {
    it("should return error for empty first name", () => {
      expect(validateFirstName("")).toBe("First name is required")
    })

    it("should return error for short first name", () => {
      expect(validateFirstName("a")).toBe(
        "First name must be at least 2 characters long",
      )
    })

    it("should return null for valid first name", () => {
      expect(validateFirstName("John")).toBeNull()
    })

    it("should return error for first name longer than 50 characters", () => {
      expect(validateFirstName("a".repeat(51))).toBe(
        "First name must not exceed 50 characters",
      )
    })
  })

  describe("validateLastName", () => {
    it("should return error for empty last name", () => {
      expect(validateLastName("")).toBe("Last name is required")
    })

    it("should return error for short last name", () => {
      expect(validateLastName("a")).toBe(
        "Last name must be at least 2 characters long",
      )
    })

    it("should return null for valid last name", () => {
      expect(validateLastName("Doe")).toBeNull()
    })

    it("should return error for last name longer than 50 characters", () => {
      expect(validateLastName("b".repeat(51))).toBe(
        "Last name must not exceed 50 characters",
      )
    })
  })

  describe("validateRole", () => {
    it("should return error for empty role", () => {
      expect(validateRole("")).toBe("Please select a role")
    })

    it("should return error for invalid role", () => {
      expect(validateRole("invalid")).toBe("Invalid role selected")
    })

    it("should return null for valid student role", () => {
      expect(validateRole("student")).toBeNull()
    })

    it("should return null for valid teacher role", () => {
      expect(validateRole("teacher")).toBeNull()
    })
  })

  describe("validateRegistrationData", () => {
    const validData: RegisterRequest = {
      role: "student",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      password: "ValidPass1!",
      confirmPassword: "ValidPass1!",
    }

    it("should return valid for correct data", () => {
      const result = validateRegistrationData(validData)
      expect(result.isValid).toBe(true)
      expect(Object.keys(result.errors)).toHaveLength(0)
    })

    it("should return invalid for incorrect data", () => {
      const invalidData = { ...validData, email: "invalid" }
      const result = validateRegistrationData(invalidData)
      expect(result.isValid).toBe(false)
      const emailError = result.errors.find((e) => e.field === "email")
      expect(emailError).toBeDefined()
    })

    it("should return field errors for all invalid registration inputs", () => {
      const invalidData: RegisterRequest = {
        role: "student",
        firstName: "A",
        lastName: "B",
        email: "invalid-email",
        password: "weak",
        confirmPassword: "mismatch",
      }

      const result = validateRegistrationData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toEqual(
        expect.arrayContaining([
          {
            field: "firstName",
            message: "First name must be at least 2 characters long",
          },
          {
            field: "lastName",
            message: "Last name must be at least 2 characters long",
          },
          { field: "email", message: "Please enter a valid email address" },
          {
            field: "password",
            message: "Password must be at least 8 characters long",
          },
          { field: "confirmPassword", message: "Passwords do not match" },
        ]),
      )
    })

    it("should include role error when role is invalid", () => {
      const invalidRoleData = {
        ...validData,
        role: "invalid-role",
      } as unknown as RegisterRequest

      const result = validateRegistrationData(invalidRoleData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: "role",
        message: "Invalid role selected",
      })
    })
  })

  describe("validateLoginData", () => {
    it("should return valid when email and password are provided", () => {
      const result = validateLoginData({
        email: "teacher@classifi.com",
        password: "Password1!",
      })

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("should return both email and password errors for empty payload", () => {
      const result = validateLoginData({
        email: "",
        password: "",
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toEqual([
        { field: "email", message: "Email is required" },
        { field: "password", message: "Password is required" },
      ])
    })

    it("should reject whitespace-only password", () => {
      const result = validateLoginData({
        email: "teacher@classifi.com",
        password: "   ",
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: "password",
        message: "Password cannot be empty",
      })
    })
  })

  describe("validateField", () => {
    it("should validate email field", () => {
      const message = validateField("email", "invalid-email")

      expect(message).toBe("Please enter a valid email address")
    })

    it("should validate password field", () => {
      const message = validateField("password", "short")

      expect(message).toBe("Password must be at least 8 characters long")
    })

    it("should validate confirmPassword when password context exists", () => {
      const message = validateField("confirmPassword", "DifferentPass1!", {
        password: "CorrectPass1!",
      })

      expect(message).toBe("Passwords do not match")
    })

    it("should return null for confirmPassword when password context is missing", () => {
      const message = validateField("confirmPassword", "AnyPass1!")

      expect(message).toBeNull()
    })

    it("should validate firstName field", () => {
      const message = validateField("firstName", "A")

      expect(message).toBe("First name must be at least 2 characters long")
    })

    it("should validate lastName field", () => {
      const message = validateField("lastName", "B")

      expect(message).toBe("Last name must be at least 2 characters long")
    })

    it("should validate role field", () => {
      const message = validateField("role", "invalid-role")

      expect(message).toBe("Invalid role selected")
    })

    it("should return null for unknown fields", () => {
      const message = validateField("unknownField", "value")

      expect(message).toBeNull()
    })
  })
})
