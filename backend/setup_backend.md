# Backend Setup Guide

## Prerequisites

1. **Python 3.11+** installed
2. **PostgreSQL** running with your ClassiFi database
3. **Supabase project** configured
4. **.env file** with correct credentials

## Step 1: Run Database Migration

Before starting the backend, run the SQL migration to add Supabase integration to your database:

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **SQL Editor**
3. Open and run: `database/migrations/002_add_supabase_integration.sql`
4. Verify the migration completed successfully

## Step 2: Update Environment Variables

Edit `backend/.env` and update these values:

```env
# Get this from Supabase Dashboard > Settings > API
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Update with your actual database connection string
DATABASE_URL=postgresql://username:password@host:port/classifi
```

**Important:**
- `SUPABASE_SERVICE_ROLE_KEY` is different from `SUPABASE_ANON_KEY`
- Find it in Supabase Dashboard > Project Settings > API > service_role key
- Keep it secret! Don't commit to Git!

## Step 3: Create Virtual Environment

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate
```

## Step 4: Install Dependencies

```bash
pip install -r requirements.txt
```

## Step 5: Start the Server

```bash
# Development mode with auto-reload
uvicorn presentation.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API Base**: http://localhost:8000
- **Interactive Docs (Swagger)**: http://localhost:8000/docs
- **Alternative Docs (ReDoc)**: http://localhost:8000/redoc

## Step 6: Test the API

### Using Swagger UI (Recommended)

1. Open http://localhost:8000/docs
2. Try the `/api/auth/register` endpoint
3. Click "Try it out"
4. Fill in the example request:

```json
{
  "role": "student",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "username": "johndoe",
  "password": "Test1234",
  "confirm_password": "Test1234"
}
```

5. Click "Execute"
6. Check the response!

### Using curl

```bash
# Register a user
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "student",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "username": "johndoe",
    "password": "Test1234",
    "confirm_password": "Test1234"
  }'

# Login
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "Test1234"
  }'
```

## API Endpoints

### Authentication Endpoints

All auth endpoints are prefixed with `/api/auth`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/verify` | Verify access token |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/logout` | Logout (client-side) |

## Troubleshooting

### Database Connection Error

```
sqlalchemy.exc.OperationalError: could not connect to server
```

**Solution:** Check your `DATABASE_URL` in `.env`. Make sure PostgreSQL is running.

### Supabase Error

```
Failed to create Supabase user
```

**Solutions:**
1. Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`
2. Check Supabase Dashboard > Authentication > Email Auth is enabled
3. Disable email confirmation (for testing): Supabase Dashboard > Authentication > Email Auth > Confirm email: OFF

### Import Errors

```
ModuleNotFoundError: No module named 'fastapi'
```

**Solution:** Make sure virtual environment is activated and dependencies are installed:
```bash
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

### CORS Error from Frontend

```
Access to fetch at 'http://localhost:8000/api/auth/login' has been blocked by CORS policy
```

**Solution:** Check `ALLOWED_ORIGINS` in `.env` includes your frontend URL (default: `http://localhost:5173`)

## Next Steps

After backend is running:
1. Update frontend to call backend API
2. Test registration flow
3. Test login flow
4. Verify data appears in both Supabase Auth and local database

## Production Deployment

Before deploying to production:

1. **Update environment variables**:
   - Set `DEBUG=False`
   - Set `ENVIRONMENT=production`
   - Use strong database password
   - Update `ALLOWED_ORIGINS` to your production frontend URL

2. **Use a production ASGI server**:
   ```bash
   gunicorn presentation.main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

3. **Enable HTTPS** (required for Supabase in production)

4. **Set up database backups**

5. **Monitor logs** and set up error tracking
