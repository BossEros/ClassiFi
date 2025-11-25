"""
Simple diagnostic to check Supabase users
"""

from shared.supabase_client import supabase


def main():
    print("=== Checking Supabase Auth Users ===\n")
    try:
        # List users from Supabase Auth
        response = supabase.auth.admin.list_users()
        
        if not response:
            print("No users found in Supabase Auth")
            print("\nAction: Please register a new account at http://localhost:5173/register")
            return
        
        print(f"Found {len(response)} user(s) in Supabase Auth:\n")
        
        for i, user in enumerate(response, 1):
            print(f"{i}. Email: {user.email}")
            print(f"   User ID: {user.id}")
            print(f"   Email Confirmed: {'✓ Yes' if user.email_confirmed_at else '✗ No (Check your email for confirmation link!)'}")
            print(f"   Created: {user.created_at}")
            
            # Check metadata
            if hasattr(user, 'user_metadata') and user.user_metadata:
                print(f"   Username: {user.user_metadata.get('username', 'Not set')}")
                print(f"   First Name: {user.user_metadata.get('first_name', 'Not set')}")
                print(f"   Last Name: {user.user_metadata.get('last_name', 'Not set')}")
                print(f"   Role: {user.user_metadata.get('role', 'Not set')}")
            
            print()
        
        print("\n=== Troubleshooting Steps ===")
        print("If you can't login with any of the above emails:")
        print("1. Make sure the email is confirmed (check your inbox)")
        print("2. Make sure you're using the correct password")
        print("3. Try the 'Forgot Password' feature if you forgot your password")
        print("4. To test, try registering a new account")
        
    except Exception as e:
        print(f"Error: {type(e).__name__}: {e}")
        print("\nThis might mean:")
        print("- Supabase service role key is incorrect")
        print("- Supabase URL is wrong")
        print("- Network connection issue")


if __name__ == "__main__":
    main()
