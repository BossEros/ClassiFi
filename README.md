# ClassiFi

A full-stack web application for classroom management and interaction, built as an undergraduate Computer Science thesis project.

## Project Overview

ClassiFi is designed to facilitate classroom interactions between instructors and students, implementing modern web development practices and following a strict 3-Tier Layered Architecture pattern across both frontend and backend.

## Architecture

This project follows a **3-Tier Layered Architecture** in both frontend and backend:
add
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
│                   BACKEND (Python)                       │
├─────────────────────────────────────────────────────────┤
│  Presentation Layer: Routers, Schemas, Middleware       │
│  Business Layer: Services, Validation, Models           │
│  Data Layer: Models, Repositories, Database             │
└─────────────────────────────────────────────────────────┘
```

## Repository Structure

```
ClassiFi/
├── frontend/                  # React + TypeScript + Vite application
│   ├── src/
│   │   ├── presentation/     # UI components and pages
│   │   ├── business/         # Services, validation, models
│   │   └── data/             # API client and repositories
│   ├── package.json
│   └── README.md            # Frontend-specific documentation
│
├── backend/                   # Python API (In Progress)
│   ├── presentation/         # Routers, schemas (Presentation)
│   ├── business/            # Services, validation (Business)
│   ├── data/                # Models, repositories (Data)
│   └── README.md            # Backend-specific documentation
│
├── docs/                      # Project documentation
│   ├── architecture/         # Architecture diagrams and docs
│   ├── api-documentation/    # API specifications
│   └── user-guide/          # User documentation
│
├── database/                  # Database scripts
│   ├── migrations/           # Database migrations
│   └── seed-data/           # Initial data scripts
│
├── README.md                 # This file
├── CLAUDE.md                # AI assistant project instructions
└── .gitignore               # Git ignore rules for monorepo
```

## Technology Stack

### Frontend
- **React** 19.2.0 - UI library
- **TypeScript** 5.9.3 - Type-safe JavaScript
- **Vite** 7.2.2 - Build tool and dev server
- **Tailwind CSS** 4.1.17 - Utility-first CSS framework
- **lucide-react** - Icon library

### Backend (Planned)
- **FastAPI** - Modern Python web framework (Recommended)
- **SQLAlchemy** - ORM
- **Pydantic** - Data validation
- **PostgreSQL / MySQL / SQLite** - Database (TBD)
- **JWT** - Authentication (python-jose)

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

For detailed frontend documentation, see [frontend/README.md](./frontend/README.md)

### Backend

> **Note**: Backend implementation is in progress. Setup instructions will be provided once available.

For backend documentation, see [backend/README.md](./backend/README.md)

## Current Status

### Completed
- ✅ Frontend architecture and structure
- ✅ Authentication UI (Login, Register, Forgot Password)
- ✅ 3-Tier architecture implementation (Frontend)
- ✅ Type-safe TypeScript models and services
- ✅ Responsive UI with Tailwind CSS

### In Progress
- 🚧 Backend API development
- 🚧 Database schema design
- 🚧 API endpoint implementation

### Planned
- 📋 User authentication and authorization (backend)
- 📋 Classroom management features
- 📋 Student-instructor interaction features
- 📋 Real-time communication (WebSockets/SignalR)
- 📋 Assignment and grade management

## Development Guidelines

### Code Organization
- Follow the 3-Tier Layered Architecture pattern
- Keep layer boundaries strict (Presentation → Business → Data)
- Use TypeScript for type safety in frontend
- Use proper dependency injection in backend

### Naming Conventions
- Use descriptive, meaningful names for all entities
- Follow TypeScript/JavaScript conventions in frontend
- Follow C# conventions in backend
- Keep consistency across the project

For detailed development guidelines, see:
- [Frontend CLAUDE.md](./frontend/CLAUDE.md) - Frontend architecture and conventions
- [Root CLAUDE.md](./CLAUDE.md) - Overall project guidelines for AI assistants

## Documentation

- [Architecture Documentation](./docs/architecture/) - System architecture diagrams and explanations
- [API Documentation](./docs/api-documentation/) - API specifications and examples
- [User Guide](./docs/user-guide/) - End-user documentation

## Contributing

This is a thesis project. For collaboration guidelines, please contact the project maintainer.

## License

This project is created for academic purposes as part of an undergraduate Computer Science thesis.

## Authors

- Christian Dave Vilan - Project Developer

## Acknowledgments

This project implements modern software engineering practices and architectural patterns learned throughout the Computer Science program.