import { inject, injectable } from "tsyringe"
import {
  UserRepository,
  USER_ROLES,
  type UserRole,
} from "@/repositories/user.repository.js"
import { SupabaseAuthAdapter } from "@/services/supabase-auth.adapter.js"
import { settings } from "@/shared/config.js"
import { toUserDTO, type UserDTO } from "@/shared/mappers.js"
import {
  UserAlreadyExistsError,
  InvalidCredentialsError,
  UserNotFoundError,
  InvalidRoleError,
} from "@/shared/errors.js"
import type { RegisterUserServiceDTO } from "./service-dtos.js"

/** Auth result type */
interface AuthResult {
  userData: UserDTO
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
 * Business logic for authentication operations.
 * Coordinates between Supabase Auth and local users table.
 */
@injectable()
export class AuthService {
  constructor(
    @inject("UserRepository") private userRepo: UserRepository,
    @inject("SupabaseAuthAdapter") private authAdapter: SupabaseAuthAdapter,
  ) {}

  /**
   * Register a new user.
   * @throws {InvalidRoleError} If role is invalid
   * @throws {UserAlreadyExistsError} If email exists
   */
  async registerUser(data: RegisterUserServiceDTO): Promise<AuthResult> {
    const { email, password, firstName, lastName, role } = data

    // Validate role BEFORE creating Supabase user to avoid creating then rolling back
    if (!isValidUserRole(role)) {
      throw new InvalidRoleError(role)
    }

    // Check if email already exists
    if (await this.userRepo.checkEmailExists(email)) {
      throw new UserAlreadyExistsError(email)
    }

    // Create Supabase auth user with metadata
    const { user: supabaseUser, token } = await this.authAdapter.signUp(
      email,
      password,
      {
        first_name: firstName,
        last_name: lastName,
        role,
      },
    )

    if (!supabaseUser) {
      throw new Error("Failed to create Supabase user")
    }

    // Create user in local database with rollback on failure
    try {
      const user = await this.userRepo.createUser({
        supabaseUserId: supabaseUser.id,
        email,
        firstName,
        lastName,
        role, // Already validated above
      })

      return {
        userData: toUserDTO(user),
        token: token ?? null,
      }
    } catch (error: unknown) {
      // Determine if this is a unique constraint violation (Postgres error code 23505)
      // and specifically on the email column
      const dbError = error as { code?: string; constraint?: string }
      const isUniqueEmailViolation =
        dbError.code === "23505" &&
        dbError.constraint &&
        dbError.constraint.includes("email")

      // Single rollback path: Delete the Supabase user to prevent orphaned records
      try {
        await this.authAdapter.deleteUser(supabaseUser.id)
      } catch (rollbackError) {
        console.error("Failed to rollback Supabase user:", rollbackError)
      }

      // Throw appropriate error based on the original error type
      if (isUniqueEmailViolation) {
        throw new UserAlreadyExistsError(email)
      }
      throw error
    }
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
