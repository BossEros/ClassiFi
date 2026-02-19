import type { UserRole } from "@/modules/users/user.repository.js"

/** DTO for AuthService.registerUser */
export interface RegisterUserServiceDTO {
  email: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
}
