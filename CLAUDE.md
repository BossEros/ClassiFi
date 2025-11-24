# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ClassiFi is a thesis project implementing a full-stack application with a **React + TypeScript + Vite** frontend and a **FastAPI + Python** backend, both following a **3-Tier Layered Architecture** pattern. The project features a complete authentication system with Supabase integration and is in active development.

## Architecture Pattern: 3-Tier Layered Architecture

The project follows a strict 3-tier architecture to separate concerns and improve maintainability:

```
┌─────────────────────────────┐
│   PRESENTATION LAYER        │  ← What users SEE (UI)
│   Components, Pages, Forms  │
└─────────────────────────────┘
            ↓
┌─────────────────────────────┐
│   BUSINESS LOGIC LAYER      │  ← What app DOES (Rules)
│   Services, Validation      │
└─────────────────────────────┘
            ↓
┌─────────────────────────────┐
│   DATA ACCESS LAYER         │  ← Where data LIVES (DB/API)
│   Repositories, API Client  │
└─────────────────────────────┘
```

### Layer Responsibilities

**Presentation Layer** (`presentation/`):
- UI components, pages, and forms
- User interactions and event handling
- Display logic only (no business rules)
- Calls business logic layer for operations

**Business Logic Layer** (`business/`):
- Application business rules and logic
- Data validation and transformation
- Service orchestration
- Model/type definitions
- No direct API calls (uses data layer)

**Data Access Layer** (`repositories/`):
- API communication
- Data persistence and retrieval
- External service integration
- Repository pattern implementation

**Shared Layer** (`shared/`):
- Utilities used across all layers
- Constants and configuration
- Helper functions

## Project Structure

```
ClassiFi/
├── frontend/                      # FRONTEND (React + TypeScript + Vite)
│   ├── presentation/              # PRESENTATION LAYER
│   │   ├── components/
│   │   │   ├── ui/               # Reusable UI primitives (Button, Input)
│   │   │   ├── forms/            # Form components (LoginForm, RegisterForm)
│   │   │   └── dashboard/        # Dashboard components
│   │   ├── pages/                # Page components (LoginPage, RegisterPage)
│   │   └── App.tsx               # Main application component
│   │
│   ├── business/                  # BUSINESS LOGIC LAYER
│   │   ├── models/
│   │   │   ├── auth/             # Auth-related types and interfaces
│   │   │   │   └── types.ts
│   │   │   └── dashboard/        # Dashboard types
│   │   │       └── types.ts
│   │   ├── services/
│   │   │   ├── auth/             # Auth service (business logic)
│   │   │   │   └── authService.ts
│   │   │   ├── dashboard/        # Dashboard service
│   │   │   │   └── teacherDashboardService.ts
│   │   │   └── class/            # Class service
│   │   │       └── classService.ts
│   │   └── validation/           # Validation rules
│   │       └── authValidation.ts
│   │
│   ├── data/                      # DATA ACCESS LAYER
│   │   ├── api/
│   │   │   ├── apiClient.ts      # Base API client
│   │   │   └── supabaseClient.ts # Supabase client
│   │   └── repositories/
│   │       ├── auth/             # Auth repository (API calls)
│   │       │   └── authRepository.ts
│   │       ├── dashboard/        # Dashboard repository
│   │       │   └── teacherDashboardRepository.ts
│   │       └── class/            # Class repository
│   │           └── classRepository.ts
│   │
│   ├── shared/                    # SHARED UTILITIES
│   │   ├── utils/
│   │   │   └── cn.ts             # Tailwind class merger
│   │   └── constants/
│   │       └── index.ts          # App-wide constants
│   │
│   ├── main.tsx                   # Application entry point
│   ├── index.css                  # Global styles
│   ├── index.html                # HTML entry point
│   ├── vite.config.ts            # Vite configuration
│   ├── tsconfig.json             # TypeScript configuration
│   ├── package.json              # Frontend dependencies
│   └── eslint.config.js          # ESLint configuration
│
├── backend/                       # BACKEND (FastAPI + Python)
│   ├── api/                       # API LAYER
│   │   ├── routers/              # API endpoint routes
│   │   │   └── auth.py           # Authentication endpoints
│   │   ├── schemas/              # Pydantic request/response models
│   │   │   └── auth.py           # Auth schemas
│   │   ├── middleware/           # Request/response pipeline
│   │   └── main.py               # FastAPI app entry point
│   │
│   ├── services/                  # SERVICES LAYER
│   │   ├── services/             # Business logic orchestration
│   │   │   └── auth_service.py   # Auth business logic
│   │   ├── validation/           # Business rule validation
│   │   └── models/               # Domain models
│   │
│   ├── repositories/             # DATA ACCESS LAYER
│   │   ├── models/               # SQLAlchemy database models
│   │   │   └── user.py           # User model
│   │   ├── repositories/         # Data access patterns
│   │   │   └── user_repository.py # User repository
│   │   └── database.py           # Database connection config
│   │
│   ├── shared/                    # SHARED UTILITIES
│   │   ├── config.py             # Environment configuration
│   │   └── supabase_client.py    # Supabase client singleton
│   │
│   ├── venv/                      # Python virtual environment
│   ├── .env                       # Environment variables
│   ├── .env.example              # Environment template
│   ├── requirements.txt          # Python dependencies
│   └── README.md                 # Backend documentation
│
├── database/                      # DATABASE
│   └── migrations/               # SQL migration files
│       └── 002_add_supabase_integration.sql
│
│   └── public/                    # Static assets
```

## Development Commands

### Frontend Commands

Run from the **root directory**:

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

### Backend Commands

Run from the **backend/** directory:

```bash
# Activate virtual environment
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Install dependencies (first time only)
pip install -r requirements.txt

# Start development server (http://localhost:8000)
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

# Access API documentation
# Swagger UI: http://localhost:8000/docs
# ReDoc: http://localhost:8000/redoc
```

### Database Commands

```bash
# Run migrations (execute in Supabase SQL Editor)
# File: database/migrations/002_add_supabase_integration.sql
```

## Technology Stack

### Frontend
- **React 19.2.0**: UI library
- **TypeScript 5.9.3**: Type safety
- **Vite 7.2.2**: Build tool and dev server
- **Tailwind CSS 4.1.17**: Styling via `@tailwindcss/vite` plugin
- **lucide-react**: Icon library
- **ESLint**: Code linting with TypeScript and React-specific rules

### Frontend UI Component Utilities
- **class-variance-authority**: For managing component variants
- **clsx + tailwind-merge**: Combined in `cn()` utility for conditional className merging

### Backend
- **FastAPI 0.109.0**: Modern Python web framework with async support
- **Python 3.12.10**: Programming language
- **Uvicorn 0.27.0**: ASGI server
- **SQLAlchemy 2.0.25**: ORM for database operations
- **PostgreSQL**: Database (via Supabase)
- **Pydantic 2.5.3**: Data validation using Python type annotations
- **Alembic 1.13.1**: Database migration tool
- **python-jose 3.3.0**: JWT token handling
- **passlib 1.7.4**: Password hashing

### Database
- **PostgreSQL**: Primary database (Supabase-hosted)
- **Supabase Auth**: Authentication service
- **SQLAlchemy**: ORM and query builder

### Authentication
- **Supabase**: Handles password storage, user management, and token generation
- **Hybrid System**: Supabase Auth + local PostgreSQL for user data
- **JWT Tokens**: Access tokens for API authentication

## Code Conventions

### Layered Architecture Rules

**CRITICAL**: Always respect layer boundaries:

1. **Presentation Layer**:
   - May import from: Business Layer, Shared Layer
   - NEVER import from: Data Layer
   - Example: `LoginForm` calls `authService.loginUser()`, not `authRepository.login()`

2. **Business Layer**:
   - May import from: Data Layer, Shared Layer
   - NEVER import from: Presentation Layer
   - Example: `authService` calls `authRepository.login()` and applies validation

3. **Data Layer**:
   - May import from: Shared Layer only
   - NEVER import from: Presentation or Business Layers
   - Example: `authRepository` only handles API calls, no validation

4. **Shared Layer**:
   - No imports from any other layer (except external packages)
   - Pure utilities and constants only

### Path Aliases

The project uses `@/` as an alias for the frontend root directory:
```typescript
import { cn } from '@/shared/utils/cn'
import { Button } from '@/presentation/components/ui/Button'
import { loginUser } from '@/business/services/auth/authService'
```

This is configured in both:
- `frontend/vite.config.ts` (resolve.alias: `'@': path.resolve(__dirname, '.')`)
- `frontend/tsconfig.json` (compilerOptions.paths: `"@/*": ["./*"]`)

### Component Organization

1. **UI Components** (`frontend/presentation/components/ui/`):
   - Reusable, generic UI primitives
   - Follow a consistent pattern with forwardRef
   - Use the `cn()` utility for className merging
   - Accept standard HTML element props
   - Example: `Button`, `Input`

2. **Form Components** (`frontend/presentation/components/forms/`):
   - Handle form state and user input
   - Call business layer services for operations
   - Display validation errors from business layer
   - Example: `LoginForm`, `RegisterForm`

3. **Page Components** (`frontend/presentation/pages/`):
   - Compose forms and UI components
   - Handle page-level state and navigation
   - Example: `LoginPage`, `RegisterPage`

4. **Services** (`frontend/business/services/`):
   - Contain business logic and orchestration
   - Call validation functions
   - Call repository methods for data operations
   - Return standardized response objects
   - Example: `authService`

5. **Repositories** (`frontend/data/repositories/`):
   - Handle all API communication
   - Return raw data from API
   - No business logic or validation
   - Example: `authRepository`

### TypeScript Conventions

- Use TypeScript for all new files
- Define interfaces in `business/models/`
- Leverage type inference where appropriate
- Use strict type checking

### Styling Approach

- Tailwind CSS with utility-first approach
- Gradient backgrounds and glassmorphism effects for auth pages
- Dark theme with purple/indigo accent colors
- Responsive design using Tailwind breakpoints

### State Management

Currently uses React's built-in `useState` for local state. No global state management library is implemented yet.

## Important Notes

### Adding New Features

When adding new features, follow this workflow:

1. **Define Types** in `frontend/business/models/`
2. **Create Validation** in `frontend/business/validation/`
3. **Create Repository** in `frontend/data/repositories/` for API calls
4. **Create Service** in `frontend/business/services/` for business logic
5. **Create UI Components** in `frontend/presentation/components/`
6. **Create Page** in `frontend/presentation/pages/` if needed

### Path Configuration

When adding new path aliases, update both:
1. `vite.config.ts` → resolve.alias
2. `tsconfig.json` → compilerOptions.paths

### Vite Cache

Custom cache directory is configured: `C:/temp/vite-cache`

### Current Limitations

- No routing library implemented yet (will need React Router or similar)
- No global state management (will need Context API or state library)
- Frontend not yet connected to backend API (still using simulated calls)
- Backend validation layer is empty (structure exists but not implemented)
- No backend tests written yet (pytest configured but no test files)
- Email verification flow not implemented
- Refresh token handling not implemented

## Authentication Flow Example

This demonstrates proper 3-tier architecture:

```
User enters credentials in LoginForm (Presentation)
          ↓
LoginForm calls authService.loginUser() (Business)
          ↓
authService validates credentials using authValidation
          ↓
authService calls authRepository.login() (Data)
          ↓
authRepository makes API call to backend
          ↓
Response flows back up: Data → Business → Presentation
```

## Backend Implementation Details

### Backend Architecture

The backend mirrors the frontend's 3-tier architecture:

**API Layer** (`backend/api/`):
- REST API endpoints using FastAPI routers
- Pydantic schemas for request/response validation
- HTTP status codes and error responses
- API documentation (Swagger/ReDoc)

**Services Layer** (`backend/services/`):
- Service orchestration and business rules
- Transaction management
- Supabase authentication integration
- Error handling and rollback logic

**Data Access Layer** (`backend/repositories/`):
- SQLAlchemy ORM models
- Repository pattern for data access
- Database session management
- CRUD operations

**Shared Layer** (`backend/shared/`):
- Configuration management
- External service clients (Supabase)
- Utility functions

### Database Schema

**User Model** (`backend/repositories/models/user.py`):
```python
class User(Base):
    __tablename__ = "users"

    id: int                          # Primary key
    supabase_user_id: UUID           # Links to Supabase auth.users (unique)
    username: str(50)                # Unique, indexed
    email: str(100)                  # Unique, indexed
    first_name: str(50)
    last_name: str(50)
    role: Enum                       # student, teacher, admin
    created_at: datetime             # Auto-set on creation
    updated_at: datetime             # Auto-updated on modification
```

**User Roles:**
- `STUDENT` - "student"
- `TEACHER` - "teacher"
- `ADMIN` - "admin"

### API Endpoints

Base URL: `http://localhost:8000`

**Health Endpoints:**
- `GET /` - API status
- `GET /health` - Health check

**Authentication Endpoints** (`/api/auth`):
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/verify` - Verify access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/logout` - Logout user

### Backend Validation

**Current Backend Validation** (`backend/api/schemas/auth.py`):

**RegisterRequest:**
- `email`: EmailStr (Pydantic email validation)
- `username`: 3-50 chars, alphanumeric + underscores only (`^[a-zA-Z0-9_]+$`)
- `password`: Min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
- `confirm_password`: Must match password
- `first_name`: 2-50 chars
- `last_name`: 2-50 chars
- `role`: One of student/teacher/admin

**LoginRequest:**
- `email`: EmailStr
- `password`: Min 6 chars

**Uniqueness Validation:**
- Email uniqueness: Checked in `user_repository.check_email_exists()`
- Username uniqueness: Checked in `user_repository.check_username_exists()`

### Supabase Integration

The backend uses a **hybrid authentication approach**:

**Supabase Responsibilities:**
- Secure password storage and hashing
- User authentication (sign in/sign up)
- JWT token generation and validation
- Password reset emails
- User session management

**Local Database Responsibilities:**
- User profile data (username, first_name, last_name, role)
- Business-specific user information
- Indexed queries for fast lookups
- Application-specific user relationships

**Two Supabase Clients:**
1. `supabase` (Service Role): Admin operations, bypasses RLS
2. `supabase_anon` (Anonymous): Respects Row Level Security

**Registration Flow:**
1. Validate request data (Pydantic)
2. Check username/email uniqueness in local DB
3. Create Supabase Auth user with `sign_up()`
4. Store metadata in Supabase (username, role, etc.)
5. Create local DB record with `supabase_user_id`
6. Return user data + access token
7. Rollback Supabase user if local DB creation fails

**Login Flow:**
1. Authenticate with Supabase using `sign_in_with_password()`
2. Extract `supabase_user_id` from response
3. Fetch user data from local database
4. Return user data + access token

### Environment Configuration

**Required Environment Variables** (`.env`):
```bash
# Supabase
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database
DATABASE_URL=postgresql://user:pass@host:port/database

# App Configuration
APP_NAME="ClassiFi API"
APP_VERSION="1.0.0"
DEBUG=True
ENVIRONMENT=development

# CORS
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# API
API_PREFIX=/api
```

### Backend Development Workflow

When adding new backend features:

1. **Define Pydantic Schemas** in `backend/api/schemas/`
2. **Create Database Model** in `backend/repositories/models/` (if needed)
3. **Implement Repository** in `backend/repositories/repositories/`
4. **Create Service** in `backend/services/services/`
5. **Define Router Endpoints** in `backend/api/routers/`
6. **Register Router** in `backend/api/main.py`
7. **Create Migration** in `database/migrations/` (if schema changes)

### Backend Layer Boundaries

**CRITICAL Backend Rules:**

1. **API Layer (Routers/Schemas)**:
   - May import from: Services Layer, Shared Layer
   - NEVER import from: Data Layer directly
   - Example: Router calls `auth_service.register_user()`, not `user_repository.create_user()`

2. **Services Layer (Services)**:
   - May import from: Data Layer, Shared Layer
   - NEVER import from: API Layer
   - Example: Service calls repository and applies business logic

3. **Data Layer (Models/Repositories)**:
   - May import from: Shared Layer only
   - NEVER import from: API or Services Layers
   - Example: Repository only handles database operations

4. **Shared Layer**:
   - No imports from any other layer
   - Pure utilities, config, and external clients only

## Byterover MCP Integration

This project uses the Byterover MCP server for knowledge management:

- **byterover-store-knowledge**: Use when learning patterns, solving errors, or completing significant tasks
- **byterover-retrieve-knowledge**: Use before starting new tasks or making architectural decisions

See `.cursor/rules/byterover-rules.mdc` for detailed usage guidelines.

[byterover-mcp]

[byterover-mcp]

You are given two tools from Byterover MCP server, including
## 1. `byterover-store-knowledge`
You `MUST` always use this tool when:

+ Learning new patterns, APIs, or architectural decisions from the codebase
+ Encountering error solutions or debugging techniques
+ Finding reusable code patterns or utility functions
+ Completing any significant task or plan implementation

## 2. `byterover-retrieve-knowledge`
You `MUST` always use this tool when:

+ Starting any new task or implementation to gather relevant context
+ Before making architectural decisions to understand existing patterns
+ When debugging issues to check for previous solutions
+ Working with unfamiliar parts of the codebase
