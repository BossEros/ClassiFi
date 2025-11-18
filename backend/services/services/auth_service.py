"""
Authentication Service
Part of the Services Layer
Handles authentication logic and coordinates between Supabase and local database
"""

from sqlalchemy.orm import Session
from repositories.repositories.user_repository import UserRepository
from repositories.models.user import UserRole
from shared.supabase_client import supabase
from typing import Optional, Tuple
from uuid import UUID


class AuthService:
    """
    Business logic for authentication operations
    Coordinates between Supabase Auth and local users table
    """

    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    def register_user(
        self,
        email: str,
        password: str,
        username: str,
        first_name: str,
        last_name: str,
        role: str
    ) -> Tuple[bool, str, Optional[dict], Optional[str]]:
        """
        Register a new user
        1. Check if username/email already exists in local DB
        2. Create Supabase auth user with metadata
        3. Create user record in local database
        4. Return success with user data and token

        Args:
            email: User's email
            password: User's password
            username: Unique username
            first_name: User's first name
            last_name: User's last name
            role: User role (student or instructor)

        Returns:
            Tuple of (success, message, user_data, token)
        """
        # Validate role
        try:
            user_role = UserRole(role)
        except ValueError:
            return False, "Invalid role. Must be 'student' or 'teacher'", None, None

        # Check if username already exists
        if self.user_repo.check_username_exists(username):
            return False, "This username is already taken. Please choose a different username.", None, None

        # Check if email already exists
        if self.user_repo.check_email_exists(email):
            return False, "An account with this email already exists. Please use a different email or try logging in.", None, None

        try:
            # Step 1: Create Supabase auth user with metadata
            supabase_response = supabase.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        "username": username,
                        "first_name": first_name,
                        "last_name": last_name,
                        "role": role
                    }
                }
            })

            if not supabase_response.user:
                error_msg = "Failed to create Supabase user"
                if hasattr(supabase_response, 'error') and supabase_response.error:
                    error_msg = supabase_response.error.message
                return False, error_msg, None, None

            supabase_user_id = UUID(supabase_response.user.id)

            # Step 2: Create user in local database
            user = self.user_repo.create_user(
                supabase_user_id=supabase_user_id,
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                role=user_role
            )

            if not user:
                # Rollback: Delete Supabase user if local DB creation failed
                try:
                    supabase.auth.admin.delete_user(str(supabase_user_id))
                except:
                    pass
                return False, "Failed to create user in database", None, None

            # Step 3: Prepare response
            user_data = {
                "id": user.id,
                "supabase_user_id": str(user.supabase_user_id),
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role.value,
                "created_at": user.created_at.isoformat()
            }

            # Get access token
            token = None
            if hasattr(supabase_response, 'session') and supabase_response.session:
                token = supabase_response.session.access_token

            return True, "Registration successful", user_data, token

        except Exception as e:
            error_msg = str(e).lower()

            # Check for specific errors
            if "user already registered" in error_msg or "already exists" in error_msg:
                return False, "An account with this email already exists. Please try logging in instead.", None, None
            elif "invalid email" in error_msg or "email" in error_msg and "invalid" in error_msg:
                return False, "Invalid email format. Please enter a valid email address.", None, None
            elif "password" in error_msg and ("weak" in error_msg or "short" in error_msg):
                return False, "Password is too weak. Please use a stronger password with at least 8 characters.", None, None
            elif "network" in error_msg or "connection" in error_msg:
                return False, "Unable to connect to the server. Please check your internet connection and try again.", None, None
            else:
                return False, f"Registration failed. Please try again or contact support if the issue persists.", None, None

    def login_user(
        self,
        email: str,
        password: str
    ) -> Tuple[bool, str, Optional[dict], Optional[str]]:
        try:
            # Step 1: Authenticate with Supabase
            supabase_response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })

            if not supabase_response.user:
                return False, "Invalid email or password", None, None

            supabase_user_id = UUID(supabase_response.user.id)

            # Step 2: Fetch user from local database
            user = self.user_repo.get_user_by_supabase_id(supabase_user_id)

            if not user:
                return False, "User not found in database", None, None

            # Step 3: Prepare response
            user_data = {
                "id": user.id,
                "supabase_user_id": str(user.supabase_user_id),
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role.value,
                "created_at": user.created_at.isoformat()
            }

            # Get access token
            token = None
            if hasattr(supabase_response, 'session') and supabase_response.session:
                token = supabase_response.session.access_token

            return True, "Login successful", user_data, token

        except Exception as e:
            error_msg = str(e).lower()

            if "invalid login credentials" in error_msg or "invalid credentials" in error_msg:
                return False, "Invalid email or password. Please check your credentials and try again.", None, None
            elif "email not confirmed" in error_msg or "email_not_confirmed" in error_msg:
                return False, "Please verify your email address before logging in. Check your inbox for the confirmation email.", None, None
            elif "user not found" in error_msg:
                return False, "No account found with this email address. Please register first.", None, None
            elif "too many requests" in error_msg or "rate limit" in error_msg:
                return False, "Too many login attempts. Please wait a few minutes and try again.", None, None
            elif "network" in error_msg or "connection" in error_msg:
                return False, "Unable to connect to the server. Please check your internet connection and try again.", None, None
            else:
                return False, f"Login failed. Please try again or contact support if the issue persists.", None, None

    def verify_token(self, token: str) -> Tuple[bool, Optional[dict]]:
        try:
            user_response = supabase.auth.get_user(token)

            if not user_response.user:
                return False, None

            supabase_user_id = UUID(user_response.user.id)

            user = self.user_repo.get_user_by_supabase_id(supabase_user_id)

            if not user:
                return False, None

            user_data = {
                "id": user.id,
                "supabase_user_id": str(user.supabase_user_id),
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role.value,
                "created_at": user.created_at.isoformat()
            }

            return True, user_data

        except Exception:
            return False, None

    def request_password_reset(self, email: str) -> Tuple[bool, str]:
        try:
            supabase.auth.reset_password_for_email(
                email,
                {
                    "redirect_to": "http://localhost:5173/reset-password"
                }
            )
            return True, "If the email exists, a password reset link has been sent"
        except Exception as e:
            error_msg = str(e).lower()
            return True, "If the email exists, a password reset link has been sent"
