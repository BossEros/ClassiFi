import { inject, injectable } from "tsyringe"
import {
  UserRepository,
  USER_ROLES,
  type UserRole,
} from "@/modules/users/user.repository.js"
import { toUserDTO, type UserDTO } from "@/modules/users/user.mapper.js"
import { SupabaseAuthAdapter } from "@/services/supabase-auth.adapter.js"
import { settings } from "@/shared/config.js"
import { createLogger } from "@/shared/logger.js"
import {
  UserAlreadyExistsError,
  InvalidCredentialsError,
  UserNotFoundError,
  InvalidRoleError,
} from "@/shared/errors.js"
import type { User } from "@/models/index.js"
import type { RegisterUserServiceDTO } from "@/modules/auth/auth.dtos.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

const logger = createLogger("AuthService")

/** Auth result type */
interface AuthResult {
  userData: UserDTO
  token: string | null
}

/** Supabase user metadata for registration */
interface SupabaseUserMetadata {
  firstName: string
  lastName: string
  role: UserRole
}

/** Supabase user creation result */
interface SupabaseUserResult {
  user: { id: string }
  token: string | null
}

/**
 * Type guard to check if a value is a valid UserRole.
 * Uses USER_ROLES constant as single source of truth.
 */
function isValidUserRole(role: string): role is UserRole {
  return (USER_ROLES as readonly string[]).includes(role)
}

/**
 * Type guard for database errors with code and constraint fields.
 * Used to safely check for specific database constraint violations.
 */
function isDbError(
  error: unknown,
): error is { code: string; constraint: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "constraint" in error &&
    typeof (error as Record<string, unknown>).code === "string" &&
    typeof (error as Record<string, unknown>).constraint === "string"
  )
}

/**
 * Business logic for authentication operations.
 * Coordinates between Supabase Auth and local users table.
 */
@injectable()
export class AuthService {
  constructor(
    @inject(DI_TOKENS.repositories.user) private userRepo: UserRepository,
    @inject(DI_TOKENS.adapters.supabaseAuth) private authAdapter: SupabaseAuthAdapter,
  ) {}

  /**
   * Register a new user.
   * Coordinates Supabase auth and local database user creation.
   * @throws {InvalidRoleError} If role is invalid
   * @throws {UserAlreadyExistsError} If email exists
   */
  async registerUser(data: RegisterUserServiceDTO): Promise<AuthResult> {
    const { email, password, firstName, lastName, role } = data

    // Validate inputs
    this.validateRegistrationData(role)

    // Check for existing user
    await this.ensureEmailNotExists(email)

    // Create Supabase auth user
    const { user: supabaseUser, token } = await this.createSupabaseUser(
      email,
      password,
      { firstName, lastName, role },
    )

    // Create local database user with rollback on failure
    const user = await this.createLocalUserWithRollback(
      supabaseUser.id,
      email,
      firstName,
      lastName,
      role,
    )

    return {
      userData: toUserDTO(user),
      token: token ?? null,
    }
  }

  /**
   * Validate registration data.
   * @throws {InvalidRoleError} If role is invalid
   */
  private validateRegistrationData(role: string): void {
    if (!isValidUserRole(role)) {
      throw new InvalidRoleError(role)
    }
  }

  /**
   * Ensure email doesn't already exist in the database.
   * @throws {UserAlreadyExistsError} If email exists
   */
  private async ensureEmailNotExists(email: string): Promise<void> {
    if (await this.userRepo.checkEmailExists(email)) {
      throw new UserAlreadyExistsError(email)
    }
  }

  /**
   * Create a Supabase auth user with metadata.
   * @throws {Error} If Supabase user creation fails
   */
  private async createSupabaseUser(
    email: string,
    password: string,
    metadata: SupabaseUserMetadata,
  ): Promise<SupabaseUserResult> {
    const { user: supabaseUser, token } = await this.authAdapter.signUp(
      email,
      password,
      {
        first_name: metadata.firstName,
        last_name: metadata.lastName,
        role: metadata.role,
      },
    )

    if (!supabaseUser) {
      throw new Error("Failed to create Supabase user")
    }

    return { user: supabaseUser, token }
  }

  /**
   * Create local database user with automatic Supabase rollback on failure.
   * @throws {UserAlreadyExistsError} If email constraint violation
   * @throws {Error} For other database errors
   */
  private async createLocalUserWithRollback(
    supabaseUserId: string,
    email: string,
    firstName: string,
    lastName: string,
    role: UserRole,
  ): Promise<User> {
    try {
      return await this.userRepo.createUser({
        supabaseUserId,
        email,
        firstName,
        lastName,
        role,
      })
    } catch (error: unknown) {
      // Rollback Supabase user to prevent orphaned records
      await this.rollbackSupabaseUser(supabaseUserId)

      // Re-throw appropriate error
      if (this.isUniqueEmailViolation(error)) {
        throw new UserAlreadyExistsError(email)
      }
      throw error
    }
  }

  /**
   * Rollback Supabase user creation.
   * Logs error if rollback fails but doesn't throw.
   */
  private async rollbackSupabaseUser(supabaseUserId: string): Promise<void> {
    try {
      await this.authAdapter.deleteUser(supabaseUserId)
    } catch (rollbackError) {
      logger.error(
        `Failed to rollback Supabase user [${supabaseUserId}]. Manual cleanup required.`,
        rollbackError,
      )
    }
  }

  /**
   * Check if error is a unique email constraint violation.
   */
  private isUniqueEmailViolation(error: unknown): boolean {
    if (!isDbError(error)) {
      return false
    }

    return error.code === "23505" && error.constraint.includes("email")
  }

  /**
   * Login a user
   * @throws {InvalidCredentialsError} If credentials are invalid
   * @throws {UserNotFoundError} If user not in local database
   */
  async loginUser(email: string, password: string): Promise<AuthResult> {
    const { accessToken, user: supabaseUser } =
      await this.authAdapter.signInWithPassword(email, password)

    if (!supabaseUser) {
      throw new InvalidCredentialsError()
    }

    const user = await this.userRepo.getUserBySupabaseId(supabaseUser.id)

    if (!user) {
      throw new UserNotFoundError(supabaseUser.id)
    }

    return {
      userData: toUserDTO(user),
      token: accessToken,
    }
  }

  /**
   * Verify a token and return user data
   * @throws {InvalidCredentialsError} If token is invalid
   */
  async verifyToken(token: string): Promise<UserDTO> {
    const supabaseUser = await this.authAdapter.getUser(token)

    if (!supabaseUser) {
      throw new InvalidCredentialsError()
    }

    const user = await this.userRepo.getUserBySupabaseId(supabaseUser.id)

    if (!user) {
      throw new UserNotFoundError(supabaseUser.id)
    }

    return toUserDTO(user)
  }

  /** Request a password reset email */
  async requestPasswordReset(email: string): Promise<void> {
    await this.authAdapter.resetPasswordForEmail(
      email,
      `${settings.frontendUrl}/reset-password`,
    )
  }
}



