import { eq, or, ilike, and, desc, count } from "drizzle-orm"
import { users, type User, type NewUser } from "../models/index.js"
import { BaseRepository } from "./base.repository.js"
import { injectable } from "tsyringe"

/** Valid user roles - single source of truth for both type and runtime validation */
export const USER_ROLES = ["student", "teacher", "admin"] as const

/** User role type - derived from the USER_ROLES array */
export type UserRole = (typeof USER_ROLES)[number]

/** Data required to create a new user */
export interface CreateUserData {
  supabaseUserId: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
}

/** Data for updating an existing user */
export interface UpdateUserData {
  email?: string
  firstName?: string
  lastName?: string
  role?: UserRole
  avatarUrl?: string
}

/** Filter options for user queries */
export interface UserFilterOptions {
  page: number
  limit: number
  search?: string
  role?: UserRole
  status?: "active" | "inactive"
}

/** Paginated result structure */
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Repository for user-related database operations.
 * Provides methods for user CRUD and lookups.
 */
@injectable()
export class UserRepository extends BaseRepository<
  typeof users,
  User,
  NewUser
> {
  constructor() {
    super(users)
  }

  /** Create a new user */
  async createUser(data: CreateUserData): Promise<User> {
    const results = await this.db
      .insert(users)
      .values({
        supabaseUserId: data.supabaseUserId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      })
      .returning()

    return results[0]
  }

  /** Get user by internal database ID */
  async getUserById(userId: number): Promise<User | undefined> {
    return await this.findById(userId)
  }

  /** Get user by Supabase user ID */
  async getUserBySupabaseId(supabaseUserId: string): Promise<User | undefined> {
    const results = await this.db
      .select()
      .from(users)
      .where(eq(users.supabaseUserId, supabaseUserId))
      .limit(1)

    return results[0]
  }

  /** Get user by email address */
  async getUserByEmail(email: string): Promise<User | undefined> {
    const results = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    return results[0]
  }

  /** Update user information */
  async updateUser(
    userId: number,
    data: UpdateUserData,
  ): Promise<User | undefined> {
    // Filter out undefined values
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined),
    )

    if (Object.keys(updateData).length === 0) {
      return await this.getUserById(userId)
    }

    return await this.update(userId, updateData)
  }

  /** Delete a user */
  async deleteUser(userId: number): Promise<boolean> {
    return await this.delete(userId)
  }

  /** Check if email already exists */
  async checkEmailExists(email: string): Promise<boolean> {
    const results = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    return results.length > 0
  }

  /**
   * Get all users with pagination and filters.
   * Moved from AdminService to follow DIP.
   */
  async getAllUsersFiltered(
    options: UserFilterOptions,
  ): Promise<PaginatedResult<User>> {
    const { page, limit, search, role, status } = options
    const offset = (page - 1) * limit

    // Build where conditions
    const conditions: ReturnType<typeof eq>[] = []

    if (search) {
      conditions.push(
        or(
          ilike(users.email, `%${search}%`),
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`),
        )!,
      )
    }

    if (role) {
      conditions.push(eq(users.role, role))
    }

    if (status === "active") {
      conditions.push(eq(users.isActive, true))
    } else if (status === "inactive") {
      conditions.push(eq(users.isActive, false))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Get total count
    const countResult = await this.db
      .select({ count: count() })
      .from(users)
      .where(whereClause)

    const total = Number(countResult[0]?.count ?? 0)

    // Get paginated data
    const data = await this.db
      .select()
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset)

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Toggle user active status.
   * Moved from AdminService to follow DIP.
   */
  async toggleActiveStatus(userId: number): Promise<User | undefined> {
    const user = await this.findById(userId)
    if (!user) return undefined

    const newStatus = !user.isActive
    const results = await this.db
      .update(users)
      .set({ isActive: newStatus })
      .where(eq(users.id, userId))
      .returning()

    return results[0]
  }

  /** Get all users by role */
  async getUsersByRole(role: UserRole): Promise<User[]> {
    return await this.db
      .select()
      .from(users)
      .where(eq(users.role, role))
      .orderBy(desc(users.createdAt))
  }

  /**
   * Get user counts grouped by role.
   * Used for admin analytics dashboard.
   */
  async getCountsByRole(): Promise<Record<string, number>> {
    const results = await this.db
      .select({
        role: users.role,
        count: count(),
      })
      .from(users)
      .groupBy(users.role)

    const roleMap: Record<string, number> = {}
    results.forEach((row) => {
      roleMap[row.role] = Number(row.count)
    })
    return roleMap
  }

  /**
   * Get most recent users.
   * Used for admin activity feed.
   */
  async getRecentUsers(limit: number = 10): Promise<User[]> {
    return await this.db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
  }
}
