import "reflect-metadata"

// Mock environment variables for tests
process.env.SUPABASE_URL = "https://test.supabase.co"
process.env.SUPABASE_ANON_KEY = "test-anon-key"
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key"
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test"
process.env.ENVIRONMENT = "development"
process.env.DEBUG = "false"

// Email service environment variables
process.env.SENDGRID_API_KEY = "test-sendgrid-key"
process.env.SMTP_HOST = "smtp.test.com"
process.env.SMTP_PORT = "587"
process.env.SMTP_USER = "test@test.com"
process.env.SMTP_PASSWORD = "test-password"
