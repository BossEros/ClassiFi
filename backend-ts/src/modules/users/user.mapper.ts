import type { User } from "@/models/index.js"

export interface UserDTO {
  id: number
  supabaseUserId: string | null
  email: string
  firstName: string
  lastName: string
  role: string
  avatarUrl: string | null
  isActive: boolean
  createdAt: string
}

export function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    supabaseUserId: user.supabaseUserId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    avatarUrl: user.avatarUrl ?? null,
    isActive: user.isActive ?? true,
    createdAt: user.createdAt?.toISOString() ?? new Date().toISOString(),
  }
}

export interface StudentDTO {
  id: number
  email: string
  firstName: string
  lastName: string
  fullName: string
}

export function toStudentDTO(user: User): StudentDTO {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
  }
}
