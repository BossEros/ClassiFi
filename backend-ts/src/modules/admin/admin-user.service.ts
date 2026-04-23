import { inject, injectable } from "tsyringe"
import {
  UserRepository,
  type UserRole,
} from "@/modules/users/user.repository.js"
import { toUserDTO, type UserDTO } from "@/modules/users/user.mapper.js"
import { UserService } from "@/modules/users/user.service.js"
import { ClassService } from "@/modules/classes/class.service.js"
import { SupabaseAuthAdapter } from "@/services/supabase-auth.adapter.js"
import {
  UserNotFoundError,
  InvalidRoleError,
  TeacherHasAssignedClassesError,
} from "@/shared/errors.js"
import { NotificationService } from "@/modules/notifications/notification.service.js"
import type {
  UserFilterOptions,
  PaginatedResult,
  CreateUserData,
} from "@/modules/admin/admin.types.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"
import { settings } from "@/shared/config.js"

@injectable()
export class AdminUserService {
  constructor(
    @inject(DI_TOKENS.repositories.user) private userRepo: UserRepository,
    @inject(DI_TOKENS.services.user) private userService: UserService,
    @inject(DI_TOKENS.services.class) private classService: ClassService,
    @inject(DI_TOKENS.services.notification)
    private notificationService: NotificationService,
    @inject(DI_TOKENS.adapters.supabaseAuth)
    private authAdapter: SupabaseAuthAdapter,
  ) {}

  /**
   * Get all users with pagination, search, and filters.
   * Delegates to UserRepository for clean separation.
   */
  async getAllUsers(
    options: UserFilterOptions,
  ): Promise<PaginatedResult<UserDTO>> {
    const { page, limit, search, role, status } = options

    // Convert 'all' values to undefined for repository
    const result = await this.userRepo.getAllUsersFiltered({
      page,
      limit,
      search,
      role: role === "all" ? undefined : role,
      status: status === "all" ? undefined : status,
    })

    const userDtos = await Promise.all(
      result.data.map((userRecord) => this.buildUserDTO(userRecord)),
    )

    return {
      ...result,
      data: userDtos,
    }
  }

  /**
   * Get a single user by ID.
   */
  async getUserById(userId: number): Promise<UserDTO> {
    const user = await this.userRepo.getUserById(userId)
    if (!user) {
      throw new UserNotFoundError(userId)
    }

    return await this.buildUserDTO(user)
  }

  /**
   * Update a user's role.
   */
  async updateUserRole(userId: number, newRole: UserRole): Promise<UserDTO> {
    const user = await this.userRepo.getUserById(userId)
    if (!user) {
      throw new UserNotFoundError(userId)
    }

    const validRoles: UserRole[] = ["student", "teacher", "admin"]
    if (!validRoles.includes(newRole)) {
      throw new InvalidRoleError(newRole)
    }

    const updated = await this.userRepo.updateUser(userId, { role: newRole })
    if (!updated) {
      throw new UserNotFoundError(userId)
    }

    return toUserDTO(updated)
  }

  /**
   * Update a user's details (First/Last Name).
   */
  async updateUserDetails(
    userId: number,
    data: { firstName?: string; lastName?: string },
  ): Promise<UserDTO> {
    const user = await this.userRepo.getUserById(userId)
    if (!user) {
      throw new UserNotFoundError(userId)
    }

    const updated = await this.userRepo.updateUser(userId, data)
    if (!updated) {
      throw new UserNotFoundError(userId)
    }

    return toUserDTO(updated)
  }

  /**
   * Update a user's email address (Admin-only for account recovery).
   * Updates both Supabase Auth and local users table.
   */
  async updateUserEmail(userId: number, newEmail: string): Promise<UserDTO> {
    // STEP 1: Load the user and verify the new email is not already in use by another account
    const user = await this.userRepo.getUserById(userId)
    if (!user) {
      throw new UserNotFoundError(userId)
    }

    const existingUser = await this.userRepo.getUserByEmail(newEmail)
    if (existingUser && existingUser.id !== userId) {
      throw new Error("Email address is already in use by another account")
    }

    if (!user.supabaseUserId) {
      throw new Error("User does not have a linked Supabase auth account")
    }

    // STEP 2: Update the email in Supabase Auth
    await this.authAdapter.updateUserEmail(user.supabaseUserId, newEmail)

    // STEP 3: Update the email in the local database
    const updated = await this.userRepo.updateUser(userId, { email: newEmail })
    if (!updated) {
      throw new UserNotFoundError(userId)
    }

    return toUserDTO(updated)
  }

  /**
   * Toggle a user's active status.
   * Delegates to UserRepository for clean separation.
   */
  async toggleUserStatus(userId: number): Promise<UserDTO> {
    const existingUser = await this.userRepo.getUserById(userId)

    if (!existingUser) {
      throw new UserNotFoundError(userId)
    }

    const updated = await this.userRepo.toggleActiveStatus(userId)

    if (!updated) {
      throw new UserNotFoundError(userId)
    }

    if (
      existingUser.role === "teacher" &&
      !existingUser.isActive &&
      updated.isActive
    ) {
      await this.notificationService.sendEmailNotificationIfEnabled(
        updated.id,
        "TEACHER_APPROVED",
        {
          teacherName: `${updated.firstName} ${updated.lastName}`.trim(),
          loginUrl: `${settings.frontendUrl}/login`,
        },
      )
    }

    return toUserDTO(updated)
  }

  /**
   * Create a new user (admin-initiated).
   */
  async createUser(data: CreateUserData): Promise<UserDTO> {
    // STEP 1: Check for an existing account with this email to prevent duplicates
    const exists = await this.userRepo.checkEmailExists(data.email)

    if (exists) {
      throw new Error(`User with email '${data.email}' already exists`)
    }

    // STEP 2: Create the user account in Supabase Auth (auto-confirmed for admin-created users)
    const authUser = await this.authAdapter.createUser({
      email: data.email,
      password: data.password,
      emailConfirm: true, // Auto-confirm for admin-created users
    })

    // STEP 3: Create the user profile record in the local database
    const user = await this.userRepo.createUser({
      supabaseUserId: authUser.id,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
    })

    return toUserDTO(user)
  }

  /**
   * Delete a user (admin-initiated).
   */
  async deleteUser(userId: number): Promise<void> {
    // STEP 1: Load and verify the user exists
    const user = await this.userRepo.getUserById(userId)
    if (!user) {
      throw new UserNotFoundError(userId)
    }

    // STEP 2: If the user is a teacher, block deletion until all owned classes are reassigned
    if (user.role === "teacher") {
      const assignedClassCount =
        await this.classService.getAssignedClassCountByTeacher(userId)

      if (assignedClassCount > 0) {
        throw new TeacherHasAssignedClassesError(assignedClassCount)
      }
    }

    // STEP 3: Delete the account (handles storage cleanup and Supabase auth removal)
    await this.userService.deleteAccount(userId)
  }

  /**
   * Get all teachers (for dropdowns).
   */
  async getAllTeachers(): Promise<UserDTO[]> {
    const teachers = await this.userRepo.getUsersByRole("teacher")
    return await Promise.all(
      teachers.map((teacherRecord) => this.buildUserDTO(teacherRecord)),
    )
  }

  /**
   * Build a user DTO with assigned-class metadata for teacher accounts.
   */
  private async buildUserDTO(userRecord: Parameters<typeof toUserDTO>[0]): Promise<UserDTO> {
    const assignedClassCount =
      userRecord.role === "teacher"
        ? await this.classService.getAssignedClassCountByTeacher(userRecord.id)
        : 0

    return toUserDTO(userRecord, { assignedClassCount })
  }
}
