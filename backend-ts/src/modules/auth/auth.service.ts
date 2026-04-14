import { inject, injectable } from "tsyringe"
import {
  UserRepository,
  USER_ROLES,
  type UserRole,
} from "@/modules/users/user.repository.js"
import { toUserDTO, type UserDTO } from "@/modules/users/user.mapper.js"
import { SupabaseAuthAdapter } from "@/services/supabase-auth.adapter.js"
import { NotificationService } from "@/modules/notifications/notification.service.js"
import type { IEmailService } from "@/services/interfaces/email.interface.js"
import {
  passwordResetEmailTemplate,
  sanitizeEmailSubject,
} from "@/services/email/templates.js"
import { settings } from "@/shared/config.js"
import { createLogger } from "@/shared/logger.js"
import { settlePromisesAndLogRejections } from "@/shared/utils.js"
import {
  UserAlreadyExistsError,
  InvalidCredentialsError,
  UserNotFoundError,
  InvalidRoleError,
} from "@/shared/errors.js"
import type { User } from "@/modules/users/user.model.js"
import type { RegisterUserServiceDTO } from "@/modules/auth/auth.dtos.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

const logger = createLogger("AuthService")
const LOCAL_USER_SYNC_MAX_ATTEMPTS = 5
const LOCAL_USER_SYNC_RETRY_DELAYS_MS = [150, 300, 600, 1200] as const

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

const REGISTERABLE_USER_ROLES = ["student", "teacher"] as const

/**
 * Build a frontend redirect URL for authentication emails.
 */
function buildFrontendAuthRedirectUrl(pathname: string): string {
  return new URL(pathname, settings.frontendUrl).toString()
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
 * Pause execution for the provided number of milliseconds.
 */
function delayExecution(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs))
}

/**
 * Business logic for authentication operations.
 * Coordinates between Supabase Auth and local users table.
 */
@injectable()
export class AuthService {
  constructor(
    @inject(DI_TOKENS.repositories.user) private userRepo: UserRepository,
    @inject(DI_TOKENS.adapters.supabaseAuth)
    private authAdapter: SupabaseAuthAdapter,
    @inject(DI_TOKENS.services.email)
    private emailService: IEmailService,
    @inject(DI_TOKENS.services.notification)
    private notificationService: NotificationService,
  ) {}

  /**
   * Register a new user.
   * Coordinates Supabase auth and local database user creation.
   * @throws {InvalidRoleError} If role is invalid
   * @throws {UserAlreadyExistsError} If email exists
   */
  async registerUser(data: RegisterUserServiceDTO): Promise<AuthResult> {
    const { email, password, firstName, lastName, role } = data

    // STEP 1: Validate that the role is a registerable role (student or teacher)
    this.validateRegistrationData(role)

    // STEP 2: Ensure the email address is not already registered
    await this.ensureEmailNotExists(email)

    // STEP 3: Create the user in Supabase Auth and receive an auth token
    const { user: supabaseUser, token } = await this.createSupabaseUser(
      email,
      password,
      { firstName, lastName, role },
    )

    // STEP 4: Create the local database user, with automatic Supabase rollback on failure
    const user = await this.createLocalUserWithRollback(
      supabaseUser.id,
      email,
      firstName,
      lastName,
      role,
    )

    // STEP 5: Notify admin users about the new registration (fire-and-forget)
    this.notifyAdminsOfNewRegistration(user).catch((error) =>
      logger.error(
        "Failed to send new user registration notifications to admins",
        { userId: user.id, error },
      ),
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
    if (
      !isValidUserRole(role) ||
      !(REGISTERABLE_USER_ROLES as readonly string[]).includes(role)
    ) {
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
        metadata: {
          first_name: metadata.firstName,
          last_name: metadata.lastName,
          role: metadata.role,
        },
        emailRedirectTo: buildFrontendAuthRedirectUrl("/login"),
      },
    )

    if (!supabaseUser) {
      throw new Error("Failed to create Supabase user")
    }

    if (!token) {
      await this.ensureSupabaseUserExistsForPendingConfirmation(
        supabaseUser.id,
        email,
      )
    }

    return { user: supabaseUser, token }
  }

  /**
   * Confirm that a signup with pending email confirmation produced a real
   * Supabase auth user rather than an obfuscated duplicate-signup response.
   */
  private async ensureSupabaseUserExistsForPendingConfirmation(
    supabaseUserId: string,
    email: string,
  ): Promise<void> {
    for (
      let attemptNumber = 1;
      attemptNumber <= LOCAL_USER_SYNC_MAX_ATTEMPTS;
      attemptNumber++
    ) {
      const supabaseUser =
        await this.authAdapter.getAdminUserById(supabaseUserId)

      if (supabaseUser) {
        return
      }

      const hasAnotherRetryAttempt =
        attemptNumber < LOCAL_USER_SYNC_MAX_ATTEMPTS

      if (!hasAnotherRetryAttempt) {
        throw new UserAlreadyExistsError(email)
      }

      const retryDelayMs = this.getLocalUserSyncRetryDelayMs(attemptNumber)

      logger.warn(
        `[Auth] Supabase signup returned user ${supabaseUserId} for ${email}, but the admin API could not find that auth record yet. Waiting ${retryDelayMs}ms before retrying confirmation lookup ${attemptNumber}/${LOCAL_USER_SYNC_MAX_ATTEMPTS}.`,
      )

      await delayExecution(retryDelayMs)
    }
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
      return await this.createLocalUserWithSyncRetry({
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
   * Retry local user creation when the referenced Supabase auth row
   * has not become visible to the database foreign-key check yet.
   */
  private async createLocalUserWithSyncRetry(data: {
    supabaseUserId: string
    email: string
    firstName: string
    lastName: string
    role: UserRole
  }): Promise<User> {
    let latestError: unknown

    for (
      let attemptNumber = 1;
      attemptNumber <= LOCAL_USER_SYNC_MAX_ATTEMPTS;
      attemptNumber++
    ) {
      try {
        return await this.userRepo.createUser(data)
      } catch (error: unknown) {
        latestError = error

        if (!this.isSupabaseUserForeignKeyViolation(error)) {
          throw error
        }

        const hasAnotherRetryAttempt =
          attemptNumber < LOCAL_USER_SYNC_MAX_ATTEMPTS

        if (!hasAnotherRetryAttempt) {
          break
        }

        await this.waitForSupabaseUserAvailability(
          data.supabaseUserId,
          attemptNumber,
        )
      }
    }

    throw latestError
  }

  /**
   * Wait for the newly created auth user to become visible through
   * the service-role admin API before retrying the local insert.
   */
  private async waitForSupabaseUserAvailability(
    supabaseUserId: string,
    attemptNumber: number,
  ): Promise<void> {
    const retryDelayMs = this.getLocalUserSyncRetryDelayMs(attemptNumber)

    const supabaseUser = await this.authAdapter.getAdminUserById(supabaseUserId)

    if (!supabaseUser) {
      logger.warn(
        `[Auth] Supabase user ${supabaseUserId} not yet visible to admin lookup during registration retry ${attemptNumber}/${LOCAL_USER_SYNC_MAX_ATTEMPTS}. Waiting ${retryDelayMs}ms before retrying local insert.`,
      )
    }

    await delayExecution(retryDelayMs)
  }

  /**
   * Resolve the retry delay to use for a given attempt number.
   */
  private getLocalUserSyncRetryDelayMs(attemptNumber: number): number {
    return (
      LOCAL_USER_SYNC_RETRY_DELAYS_MS[attemptNumber - 1] ??
      LOCAL_USER_SYNC_RETRY_DELAYS_MS[
        LOCAL_USER_SYNC_RETRY_DELAYS_MS.length - 1
      ]
    )
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
   * Check if error is the transient FK violation caused by the auth user
   * not being referenceable yet from the local users table.
   */
  private isSupabaseUserForeignKeyViolation(error: unknown): boolean {
    if (!isDbError(error)) {
      return false
    }

    return (
      error.code === "23503" && error.constraint === "fk_users_supabase_user_id"
    )
  }

  /**
   * Login a user
   * @throws {InvalidCredentialsError} If credentials are invalid
   * @throws {UserNotFoundError} If user not in local database
   */
  async loginUser(email: string, password: string): Promise<AuthResult> {
    // STEP 1: Authenticate with Supabase and retrieve the access token
    const { accessToken, user: supabaseUser } =
      await this.authAdapter.signInWithPassword(email, password)

    if (!supabaseUser) {
      throw new InvalidCredentialsError()
    }

    // STEP 2: Find the matching local user record by Supabase ID
    const user = await this.userRepo.getUserBySupabaseId(supabaseUser.id)

    if (!user) {
      throw new UserNotFoundError(supabaseUser.id)
    }

    // STEP 3: Return the user profile DTO and access token
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
    const user = await this.userRepo.getUserByEmail(email)

    if (!user) {
      return
    }

    const { actionLink } = await this.authAdapter.generatePasswordRecoveryLink(
      email,
      buildFrontendAuthRedirectUrl("/reset-password"),
    )

    await this.emailService.sendEmail({
      to: email,
      subject: sanitizeEmailSubject("Reset Your Password"),
      html: passwordResetEmailTemplate({
        resetUrl: actionLink,
      }),
    })
  }

  /**
   * Notify all admin users about a new user registration.
   *
   * @param user - The newly registered user.
   */
  private async notifyAdminsOfNewRegistration(user: User): Promise<void> {
    const adminUsers = await this.userRepo.getUsersByRole("admin")

    if (adminUsers.length === 0) {
      return
    }

    const notificationData = {
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      userRole: user.role,
    }

    const notificationPromises = adminUsers.flatMap((admin) => [
      this.notificationService.createNotification(
        admin.id,
        "NEW_USER_REGISTERED",
        notificationData,
      ),
      this.notificationService.sendEmailNotificationIfEnabled(
        admin.id,
        "NEW_USER_REGISTERED",
        notificationData,
      ),
    ])

    await settlePromisesAndLogRejections(
      notificationPromises,
      logger,
      "Failed to notify admins of new registration",
      { userId: user.id },
    )
  }
}
