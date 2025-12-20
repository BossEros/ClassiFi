/**
 * Test Setup
 * Runs before each test file
 */
import 'reflect-metadata';

// Mock environment variables for tests
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.ENVIRONMENT = 'development';
process.env.DEBUG = 'false';
