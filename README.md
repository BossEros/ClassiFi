# ClassiFi

A full-stack web application for classroom management and interaction, built as an undergraduate Computer Science thesis project.

## Project Overview

ClassiFi is designed to facilitate classroom interactions between instructors and students, implementing modern web development practices and following a strict 3-Tier Layered Architecture pattern across both frontend and backend.

## Architecture

This project follows a **3-Tier Layered Architecture** in both frontend and backend:

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
├─────────────────────────────────────────────────────────┤
│  Presentation Layer: UI Components, Pages               │
│  Business Layer: Services, Validation, Models           │
│  Data Layer: API Client, Repositories                   │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTP/REST API
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (TypeScript)                   │
├─────────────────────────────────────────────────────────┤
│  Presentation Layer: Controllers, Schemas, Middleware   │
│  Business Layer: Services                               │
│  Data Layer: Models, Repositories, Database             │
└─────────────────────────────────────────────────────────┘
```

## Repository Structure

```
ClassiFi/
├── frontend/                  # React + TypeScript + Vite application
│   ├── presentation/         # UI components and pages
│   ├── business/            # Services, validation, models
│   ├── data/                # API client and repositories
│   ├── package.json
│   └── README.md            # Frontend-specific documentation
│
├── backend-ts/                # TypeScript/Fastify Backend (Active)
│   ├── src/
│   │   ├── api/              # Controllers, routes, schemas
│   │   ├── services/         # Business logic
│   │   ├── repositories/     # Data access
│   │   └── models/           # Drizzle ORM models
│   ├── documentation.md      # Backend-specific documentation
│   └── package.json
│
├── backend-python-deprecated/ # Python Backend (Deprecated)
│
├── docs/                      # Project documentation
├── database/                  # Database scripts
├── README.md                 # This file
└── CLAUDE.md                # AI assistant project instructions
```

## Technology Stack

### Frontend
- **React** 19.2.0 - UI library
- **TypeScript** 5.9.3 - Type-safe JavaScript
- **Vite** 7.2.2 - Build tool and dev server
- **Tailwind CSS** 4.1.17 - Utility-first CSS framework
- **lucide-react** - Icon library

### Backend
- **Node.js** 18+ - Runtime
- **TypeScript** 5.x - Language
- **Fastify** 5.x - Web framework
- **Drizzle ORM** - Database ORM
- **PostgreSQL** - Database
- **Supabase** - Auth & Storage

## Getting Started

### Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The frontend will be available at `http://localhost:5173`

### Backend

```bash
# Navigate to backend directory
cd backend-ts

# Install dependencies
npm install

# Start development server
npm run dev
```

The backend API will be available at `http://localhost:8001`

For detailed backend documentation, see [backend-ts/documentation.md](./backend-ts/documentation.md)

## Current Status

### Completed
- ✅ Frontend architecture and structure
- ✅ Authentication UI (Login, Register, Forgot Password)
- ✅ 3-Tier architecture implementation (Frontend & Backend)
- ✅ Type-safe TypeScript models and services
- ✅ Responsive UI with Tailwind CSS
- ✅ Backend API development (TypeScript)

### In Progress
- 🚧 Integration testing
- 🚧 Advanced features implementation

## Development Guidelines

### Code Organization
- Follow the 3-Tier Layered Architecture pattern
- Keep layer boundaries strict (Presentation → Business → Data)
- Use TypeScript for type safety in frontend and backend

## License

This project is created for academic purposes as part of an undergraduate Computer Science thesis.

## Authors

- Christian Dave Vilan - Project Developer
