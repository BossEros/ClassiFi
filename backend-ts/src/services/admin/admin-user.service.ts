import { inject, injectable } from "tsyringe"
import {
  UserRepository,
  type UserRole,
} from "../../repositories/user.repository.js"
import { UserService } from "../user.service.js"
import { ClassService } from "../class.service.js"
import { SupabaseAuthAdapter } from "../supabase-auth.adapter.js"
import { toUserDTO, type UserDTO } from "../../shared/mappers.js"
import { UserNotFoundError, InvalidRoleError } from "../../shared/errors.js"
import type {
  UserFilterOptions,
  PaginatedResult,
  CreateUserData,
} from "./admin.types.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

@injectable()
export class AdminUserService {
  constructor(
    @inject(DI_TOKENS.repositories.user) private userRepo: UserRepository,
    @inject(DI_TOKENS.services.user) private userService: UserService,
    @inject(DI_TOKENS.services.class) private classService: ClassService,
    @inject(DI_TOKENS.adapters.supabaseAuth) private authAdapter: SupabaseAuthAdapter,
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

    return {
      ...result,
      data: result.data.map((u) => toUserDTO(u)),
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
    return toUserDTO(user)
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
    const user = await this.userRepo.getUserById(userId)
    if (!user) {
      throw new UserNotFoundError(userId)
    }

    // Check if new email is already in use
    const existingUser = await this.userRepo.getUserByEmail(newEmail)
    if (existingUser && existingUser.id !== userId) {
      throw new Error("Email address is already in use by another account")
    }

    // Ensure user has a Supabase auth account
    if (!user.supabaseUserId) {
      throw new Error("User does not have a linked Supabase auth account")
    }

    // Update email in Supabase Auth
    await this.authAdapter.updateUserEmail(user.supabaseUserId, newEmail)

    // Update email in local users table
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
    const updated = await this.userRepo.toggleActiveStatus(userId)

    if (!updated) {
      throw new UserNotFoundError(userId)
    }

    return toUserDTO(updated)
  }

  /**
   * Create a new user (admin-initiated).
   */
  async createUser(data: CreateUserData): Promise<UserDTO> {
    // Check if email exists
    const exists = await this.userRepo.checkEmailExists(data.email)

    if (exists) {
      throw new Error(`User with email '${data.email}' already exists`)
    }

    // Create user in Supabase Auth
    const authUser = await this.authAdapter.createUser({
      email: data.email,
      password: data.password,
      emailConfirm: true, // Auto-confirm for admin-created users
    })

    // Create user in local database
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
    const user = await this.userRepo.getUserById(userId)
    if (!user) {
      throw new UserNotFoundError(userId)
    }

    // If user is a teacher, delete their classes first for proper file cleanup
    if (user.role === "teacher") {
      await this.classService.deleteClassesByTeacher(userId)
    }

    // Use UserService to safely delete account (handles file cleanup)
    await this.userService.deleteAccount(userId)
  }

  /**
   * Get all teachers (for dropdowns).
   */
  async getAllTeachers(): Promise<UserDTO[]> {
    const teachers = await this.userRepo.getUsersByRole("teacher")
    return teachers.map((t) => toUserDTO(t))
  }
}