-- ============================================================================
-- Supabase Integration Migration
-- ============================================================================
-- This migration modifies the existing users table to integrate with Supabase Auth
--
-- Changes:
-- 1. Adds supabase_user_id column as foreign key to auth.users
-- 2. Drops the password column (Supabase will manage passwords)
-- 3. Makes email the primary authentication identifier
-- 4. Adds updated_at column for tracking changes
--
-- Run this in your Supabase SQL Editor:
-- https://app.supabase.com/project/YOUR_PROJECT/sql
-- ============================================================================

-- ============================================================================
-- 1. ADD SUPABASE_USER_ID COLUMN
-- ============================================================================
-- This column links your users table to Supabase's auth.users table

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS supabase_user_id uuid UNIQUE;

-- Add foreign key constraint to auth.users
-- Note: This will cascade delete - when Supabase user is deleted, your user record is also deleted
ALTER TABLE public.users
ADD CONSTRAINT fk_users_supabase_user_id
FOREIGN KEY (supabase_user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_supabase_user_id ON public.users(supabase_user_id);

-- ============================================================================
-- 2. REMOVE PASSWORD COLUMN
-- ============================================================================
-- Supabase Auth will handle all password management
-- IMPORTANT: Back up your data before running this if you have existing users!

-- First, check if there are any existing users
-- DO $$
-- BEGIN
--   IF EXISTS (SELECT 1 FROM public.users LIMIT 1) THEN
--     RAISE NOTICE 'WARNING: You have existing users. Back up your data before dropping the password column!';
--   END IF;
-- END $$;

-- Drop the password column
ALTER TABLE public.users
DROP COLUMN IF EXISTS password CASCADE;

-- ============================================================================
-- 3. ADD UPDATED_AT COLUMN
-- ============================================================================
-- Track when user records are modified

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- 4. CREATE UPDATED_AT TRIGGER
-- ============================================================================
-- Automatically update the updated_at timestamp

CREATE OR REPLACE FUNCTION public.update_users_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_users_updated_at ON public.users;

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_users_updated_at();

-- ============================================================================
-- 5. UPDATE CONSTRAINTS (OPTIONAL)
-- ============================================================================
-- Make supabase_user_id NOT NULL after initial migration is complete
-- Uncomment this after all users have been migrated to Supabase

-- ALTER TABLE public.users
-- ALTER COLUMN supabase_user_id SET NOT NULL;

-- ============================================================================
-- 6. ADD COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.users.supabase_user_id IS
  'Foreign key to auth.users.id - Links this user record to Supabase authentication';

COMMENT ON COLUMN public.users.updated_at IS
  'Timestamp of last update to user record';

  COMMENT ON TABLE public.users IS
    'Stores information about all system users (students, instructors). Authentication handled by Supabase Auth.';

-- ============================================================================
-- 7. VERIFY MIGRATION
-- ============================================================================
-- Run this to check the migration was successful

DO $$
DECLARE
  column_exists boolean;
  fk_exists boolean;
BEGIN
  -- Check if supabase_user_id column exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'supabase_user_id'
  ) INTO column_exists;

  -- Check if foreign key exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND constraint_name = 'fk_users_supabase_user_id'
  ) INTO fk_exists;

  IF column_exists AND fk_exists THEN
    RAISE NOTICE '✅ Migration successful! supabase_user_id column and foreign key created.';
  ELSE
    RAISE WARNING '⚠️  Migration may have failed. Please check manually.';
  END IF;

  -- Check if password column was removed
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'password'
  ) INTO column_exists;

  IF NOT column_exists THEN
    RAISE NOTICE '✅ Password column successfully removed.';
  ELSE
    RAISE WARNING '⚠️  Password column still exists. Check migration script.';
  END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Set up your FastAPI backend
-- 2. Create an endpoint that handles user registration:
--    a. Create Supabase Auth user with signUp()
--    b. Insert record into users table with supabase_user_id
-- 3. For login, use Supabase signInWithPassword()
-- 4. Frontend should call your backend API, not Supabase directly
-- ============================================================================
