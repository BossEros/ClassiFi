# E2E Test Setup

## Test Credentials

The E2E tests require test user credentials to be provided via environment variables. This ensures that sensitive credentials are not committed to the repository.

### Required Environment Variables

Set the following environment variables before running E2E tests:

```bash
TEST_TEACHER_EMAIL=your_teacher_test_email
TEST_TEACHER_PASSWORD=your_teacher_test_password
TEST_STUDENT_EMAIL=your_student_test_email
TEST_STUDENT_PASSWORD=your_student_test_password
```

### Local Development Setup

1. Copy the `.env.example` file to `.env` in the frontend directory:

   ```bash
   cp .env.example .env
   ```

2. Add the test credentials to your `.env` file:

   ```bash
   # E2E Test Credentials
   TEST_TEACHER_EMAIL=teacher@your-domain.com
   TEST_TEACHER_PASSWORD=YourTestPassword123!
   TEST_STUDENT_EMAIL=student@your-domain.com
   TEST_STUDENT_PASSWORD=YourTestPassword123!
   ```

   **Note:** Replace these placeholder values with your actual test account credentials.

3. Run the E2E tests:
   ```bash
   npm playwright test
   ```

### CI/CD Setup

For CI/CD pipelines (GitHub Actions, GitLab CI, etc.), set these environment variables as secrets in your CI/CD platform:

- `TEST_TEACHER_EMAIL`
- `TEST_TEACHER_PASSWORD`
- `TEST_STUDENT_EMAIL`
- `TEST_STUDENT_PASSWORD`

The tests will automatically fail with a clear error message if any required environment variable is missing.

## Security Notes

- Never commit actual credentials to the repository
- Use test-specific accounts with limited permissions
- Rotate test credentials regularly
- Consider using different credentials for CI/CD vs local development
