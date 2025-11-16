"""
Authentication Service
Part of the Business Logic Layer
Handles authentication logic and coordinates between Supabase and local database
"""

from sqlalchemy.orm import Session
from data.repositories.user_repository import UserRepository
from data.models.user import UserRole
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
            return False, "Invalid role. Must be 'student' or 'instructor'", None, None

        # Check if username already exists
        if self.user_repo.check_username_exists(username):
            return False, "Username already exists", None, None

        # Check if email already exists
        if self.user_repo.check_email_exists(email):
            return False, "Email already exists", None, None

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
            return False, f"Registration failed: {str(e)}", None, None

    def login_user(
        self,
        email: str,
        password: str
    ) -> Tuple[bool, str, Optional[dict], Optional[str]]:
        """
        Login a user
        1. Authenticate with Supabase
        2. Fetch user data from local database
        3. Return user data and token

        Args:
            email: User's email
            password: User's password

        Returns:
            Tuple of (success, message, user_data, token)
        """
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
            return False, f"Login failed: {str(e)}", None, None

    def verify_token(self, token: str) -> Tuple[bool, Optional[dict]]:
        """
        Verify Supabase access token and get user data

        Args:
            token: Supabase access token

        Returns:
            Tuple of (is_valid, user_data)
        """
        try:
            # Get user from token
            user_response = supabase.auth.get_user(token)

            if not user_response.user:
                return False, None

            supabase_user_id = UUID(user_response.user.id)

            # Fetch from local database
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
        """
        Request a password reset email from Supabase

        Args:
            email: User's email address

        Returns:
            Tuple of (success, message)
        """
        try:
            supabase.auth.reset_password_email(email)
            # Always return success for security (don't reveal if email exists)
            return True, "If the email exists, a password reset link has been sent"
        except Exception as e:
            return False, f"Failed to send password reset email: {str(e)}"
