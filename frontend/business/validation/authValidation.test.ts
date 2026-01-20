import { describe, it, expect } from "vitest";
import {
  validateEmail,
  validatePassword,
  validatePasswordsMatch,
  validateFirstName,
  validateLastName,
  validateRole,
  validateRegistrationData,
} from "./authValidation";

describe("Auth Validation", () => {
  describe("validateEmail", () => {
    it("should return error for empty email", () => {
      expect(validateEmail("")).toBe("Email is required");
    });

    it("should return error for invalid email format", () => {
      expect(validateEmail("invalid-email")).toBe(
        "Please enter a valid email address",
      );
    });

    it("should return null for valid email", () => {
      expect(validateEmail("test@example.com")).toBeNull();
    });
  });

  describe("validatePassword", () => {
    it("should return error for empty password", () => {
      expect(validatePassword("")).toBe("Password is required");
    });

    it("should return error for short password", () => {
      expect(validatePassword("short")).toBe(
        "Password must be at least 8 characters long",
      );
    });

    it("should return error for missing uppercase", () => {
      expect(validatePassword("lowercaseonly1!")).toBe(
        "Password must contain at least one uppercase letter",
      );
    });

    it("should return error for missing lowercase", () => {
      expect(validatePassword("UPPERCASEONLY1!")).toBe(
        "Password must contain at least one lowercase letter",
      );
    });

    it("should return error for missing number", () => {
      expect(validatePassword("NoNumber!")).toBe(
        "Password must contain at least one number",
      );
    });

    it("should return error for missing special char", () => {
      expect(validatePassword("NoSpecialChar1")).toBe(
        'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)',
      );
    });

    it("should return null for valid password", () => {
      expect(validatePassword("ValidPass1!")).toBeNull();
    });
  });

  describe("validatePasswordsMatch", () => {
    it("should return error for empty confirm password", () => {
      expect(validatePasswordsMatch("password", "")).toBe(
        "Please confirm your password",
      );
    });

    it("should return error for mismatching passwords", () => {
      expect(validatePasswordsMatch("password", "different")).toBe(
        "Passwords do not match",
      );
    });

    it("should return null for matching passwords", () => {
      expect(validatePasswordsMatch("password", "password")).toBeNull();
    });
  });

  describe("validateFirstName", () => {
    it("should return error for empty first name", () => {
      expect(validateFirstName("")).toBe("First name is required");
    });

    it("should return error for short first name", () => {
      expect(validateFirstName("a")).toBe(
        "First name must be at least 2 characters long",
      );
    });

    it("should return null for valid first name", () => {
      expect(validateFirstName("John")).toBeNull();
    });
  });

  describe("validateLastName", () => {
    it("should return error for empty last name", () => {
      expect(validateLastName("")).toBe("Last name is required");
    });

    it("should return error for short last name", () => {
      expect(validateLastName("a")).toBe(
        "Last name must be at least 2 characters long",
      );
    });

    it("should return null for valid last name", () => {
      expect(validateLastName("Doe")).toBeNull();
    });
  });

  describe("validateRole", () => {
    it("should return error for empty role", () => {
      expect(validateRole("")).toBe("Please select a role");
    });

    it("should return error for invalid role", () => {
      expect(validateRole("invalid")).toBe("Invalid role selected");
    });

    it("should return null for valid student role", () => {
      expect(validateRole("student")).toBeNull();
    });

    it("should return null for valid teacher role", () => {
      expect(validateRole("teacher")).toBeNull();
    });
  });

  describe("validateRegistrationData", () => {
    const validData = {
      role: "student",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      password: "ValidPass1!",
      confirmPassword: "ValidPass1!",
    };

    it("should return valid for correct data", () => {
      const result = validateRegistrationData(validData);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it("should return invalid for incorrect data", () => {
      const invalidData = { ...validData, email: "invalid" };
      const result = validateRegistrationData(invalidData);
      expect(result.isValid).toBe(false);
      const emailError = result.errors.find((e) => e.field === "email");
      expect(emailError).toBeDefined();
    });
  });
});
