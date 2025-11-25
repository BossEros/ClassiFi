"""
Debug script to troubleshoot login issues
Run this to check:
1. If Supabase connection is working
2. If a test user exists
3. What the exact error is during login
"""

import asyncio
from shared.config import settings
from shared.supabase_client import supabase
from repositories.database import AsyncSessionLocal
from repositories.repositories.user_repository import UserRepository
from services.services.auth_service import AuthService


async def test_supabase_connection():
    """Test if Supabase is configured correctly"""
    print("\n=== Testing Supabase Connection ===")
    try:
        print(f"Supabase URL: {settings.supabase_url}")
        print(f"Supabase Anon Key: {settings.supabase_anon_key[:20]}...")
        print(f"Supabase Service Role Key: {settings.supabase_service_role_key[:20]}...")
        print("✓ Supabase configuration loaded successfully")
        return True
    except Exception as e:
        print(f"✗ Error loading Supabase configuration: {e}")
        return False


async def list_users_in_db():
    """List all users in the local database"""
    print("\n=== Users in Database ===")
    async with AsyncSessionLocal() as db:
        user_repo = UserRepository(db)
        try:
            # Import necessary for query
            from sqlalchemy import select
            from repositories.models.user import User
            
            result = await db.execute(select(User))
            users = result.scalars().all()
            
            if not users:
                print("No users found in the database")
                return []
            
            print(f"Found {len(users)} user(s):")
            for user in users:
                print(f"  - Email: {user.email}")
                print(f"    Username: {user.username}")
                print(f"    Role: {user.role.value}")
                print(f"    Supabase ID: {user.supabase_user_id}")
                print()
            
            return users
        except Exception as e:
            print(f"✗ Error querying database: {e}")
            return []


async def test_login_with_user(email: str, password: str):
    """Test login with specific credentials"""
    print(f"\n=== Testing Login for {email} ===")
    async with AsyncSessionLocal() as db:
        auth_service = AuthService(db)
        
        try:
            success, message, user_data, token = await auth_service.login_user(
                email=email,
                password=password
            )
            
            if success:
                print(f"✓ Login successful!")
                print(f"  Message: {message}")
                print(f"  User: {user_data.get('username') if user_data else 'None'}")
                print(f"  Token: {token[:20]}..." if token else "  Token: None")
            else:
                print(f"✗ Login failed!")
                print(f"  Message: {message}")
                
        except Exception as e:
            print(f"✗ Exception during login: {type(e).__name__}: {e}")


async def test_supabase_users():
    """Try to list users from Supabase Auth"""
    print("\n=== Checking Supabase Auth Users ===")
    try:
        # Note: This requires admin privileges
        response = supabase.auth.admin.list_users()
        if response:
            print(f"Found {len(response)} Supabase auth user(s)")
            for user in response:
                print(f"  - Email: {user.email}")
                print(f"    ID: {user.id}")
                print(f"    Confirmed: {user.email_confirmed_at is not None}")
                print()
        else:
            print("No Supabase users found or unable to list users")
    except Exception as e:
        print(f"✗ Error listing Supabase users: {type(e).__name__}: {e}")


async def main():
    """Run all diagnostic tests"""
    print("=== ClassiFi Login Diagnostic Tool ===")
    
    # Test 1: Check Supabase configuration
    await test_supabase_connection()
    
    # Test 2: List database users
    users = await list_users_in_db()
    
    # Test 3: Check Supabase auth users
    await test_supabase_users()
    
    # Test 4: If there are users, try to login with the first one
    if users:
        print("\n=== Suggested Actions ===")
        print(f"Try logging in with one of the above emails.")
        print(f"If you don't know the password, you can:")
        print(f"  1. Use the 'Forgot Password' feature")
        print(f"  2. Register a new account")
        print(f"  3. Reset the password in Supabase dashboard")
        
        # Optional: Uncomment to test login with a specific user
        # email = users[0].email
        # password = input(f"\nEnter password for {email} to test: ")
        # await test_login_with_user(email, password)
    else:
        print("\n=== Suggested Actions ===")
        print("No users found in the database!")
        print("Please register a new account at http://localhost:5173/register")
    
    print("\n=== Diagnostic Complete ===")


if __name__ == "__main__":
    asyncio.run(main())
