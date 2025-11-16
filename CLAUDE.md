# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ClassiFi is a thesis project implementing a React + TypeScript + Vite application following a **3-Tier Layered Architecture** pattern. The project currently implements authentication UI (login and registration) and is in early development.

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

**Presentation Layer** (`src/presentation/`):
- UI components, pages, and forms
- User interactions and event handling
- Display logic only (no business rules)
- Calls business logic layer for operations

**Business Logic Layer** (`src/business/`):
- Application business rules and logic
- Data validation and transformation
- Service orchestration
- Model/type definitions
- No direct API calls (uses data layer)

**Data Access Layer** (`src/data/`):
- API communication
- Data persistence and retrieval
- External service integration
- Repository pattern implementation

**Shared Layer** (`src/shared/`):
- Utilities used across all layers
- Constants and configuration
- Helper functions

## Project Structure

```
ClassiFi/
├── src/
│   ├── presentation/              # PRESENTATION LAYER
│   │   ├── components/
│   │   │   ├── ui/               # Reusable UI primitives (Button, Input)
│   │   │   └── forms/            # Form components (LoginForm, RegisterForm)
│   │   ├── pages/                # Page components (LoginPage, RegisterPage)
│   │   └── App.tsx               # Main application component
│   │
│   ├── business/                  # BUSINESS LOGIC LAYER
│   │   ├── models/
│   │   │   └── auth/             # Auth-related types and interfaces
│   │   │       └── types.ts
│   │   ├── services/
│   │   │   └── auth/             # Auth service (business logic)
│   │   │       └── authService.ts
│   │   └── validation/           # Validation rules
│   │       └── authValidation.ts
│   │
│   ├── data/                      # DATA ACCESS LAYER
│   │   ├── api/
│   │   │   └── apiClient.ts      # Base API client
│   │   └── repositories/
│   │       └── auth/             # Auth repository (API calls)
│   │           └── authRepository.ts
│   │
│   ├── shared/                    # SHARED UTILITIES
│   │   ├── utils/
│   │   │   └── cn.ts             # Tailwind class merger
│   │   └── constants/
│   │       └── index.ts          # App-wide constants
│   │
│   ├── main.tsx                   # Application entry point
│   └── index.css                  # Global styles
│
├── public/                        # Static assets
├── index.html                     # HTML entry point
├── vite.config.ts                 # Vite configuration
├── tsconfig.json                  # TypeScript configuration
├── package.json                   # Dependencies and scripts
└── eslint.config.js               # ESLint configuration
```

## Development Commands

All commands should be run from the **root directory**:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Technology Stack

### Frontend
- **React 19.2.0**: UI library
- **TypeScript 5.9.3**: Type safety
- **Vite 7.2.2**: Build tool and dev server
- **Tailwind CSS 4.1.17**: Styling via `@tailwindcss/vite` plugin
- **lucide-react**: Icon library
- **ESLint**: Code linting with TypeScript and React-specific rules

### UI Component Utilities
- **class-variance-authority**: For managing component variants
- **clsx + tailwind-merge**: Combined in `cn()` utility for conditional className merging

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

The project uses `@/` as an alias for `./src/`:
```typescript
import { cn } from '@/shared/utils/cn'
import { Button } from '@/presentation/components/ui/Button'
import { loginUser } from '@/business/services/auth/authService'
```

This is configured in both:
- `vite.config.ts` (resolve.alias)
- `tsconfig.json` (compilerOptions.paths)

### Component Organization

1. **UI Components** (`src/presentation/components/ui/`):
   - Reusable, generic UI primitives
   - Follow a consistent pattern with forwardRef
   - Use the `cn()` utility for className merging
   - Accept standard HTML element props
   - Example: `Button`, `Input`

2. **Form Components** (`src/presentation/components/forms/`):
   - Handle form state and user input
   - Call business layer services for operations
   - Display validation errors from business layer
   - Example: `LoginForm`, `RegisterForm`

3. **Page Components** (`src/presentation/pages/`):
   - Compose forms and UI components
   - Handle page-level state and navigation
   - Example: `LoginPage`, `RegisterPage`

4. **Services** (`src/business/services/`):
   - Contain business logic and orchestration
   - Call validation functions
   - Call repository methods for data operations
   - Return standardized response objects
   - Example: `authService`

5. **Repositories** (`src/data/repositories/`):
   - Handle all API communication
   - Return raw data from API
   - No business logic or validation
   - Example: `authRepository`

### TypeScript Conventions

- Use TypeScript for all new files
- Define interfaces in `src/business/models/`
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

1. **Define Types** in `src/business/models/`
2. **Create Validation** in `src/business/validation/`
3. **Create Repository** in `src/data/repositories/` for API calls
4. **Create Service** in `src/business/services/` for business logic
5. **Create UI Components** in `src/presentation/components/`
6. **Create Page** in `src/presentation/pages/` if needed

### Path Configuration

When adding new path aliases, update both:
1. `vite.config.ts` → resolve.alias
2. `tsconfig.json` → compilerOptions.paths

### Vite Cache

Custom cache directory is configured: `C:/temp/vite-cache`

### Current Limitations

- Backend is not yet implemented (using simulated API calls)
- Authentication is currently UI-only (simulated with setTimeout)
- No routing library implemented (will need React Router or similar)
- No global state management (will need Context API or state library)

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

## Byterover MCP Integration

This project uses the Byterover MCP server for knowledge management:

- **byterover-store-knowledge**: Use when learning patterns, solving errors, or completing significant tasks
- **byterover-retrieve-knowledge**: Use before starting new tasks or making architectural decisions

See `.cursor/rules/byterover-rules.mdc` for detailed usage guidelines.
