# ClassiFi Backend

## Overview

This directory will contain the ClassiFi backend API built with Python, following the 3-Tier Layered Architecture pattern.

## Architecture

The backend follows a clean 3-tier architecture:

```
presentation/             (Presentation Layer)
├── routers/             - API endpoints/routes
├── middleware/          - Request/response pipeline
├── schemas/             - Pydantic schemas for request/response
└── main.py             - Application entry point

business/               
 (Business Logic Layer)
├── services/           - Business logic and orchestration
├── validation/         - Business rule validation
└── models/             - Domain models

data/                   (Data Access Layer)
├── models/             - Database models (SQLAlchemy/Django ORM)
├── repositories/       - Data access patterns
└── migrations/         - Database migrations
```

## Framework Recommendation

You have several excellent options for Python web frameworks:

### Option 1: FastAPI (Recommended for this project)
**Pros:**
- Modern, fast (high-performance)
- Built-in API documentation (Swagger/OpenAPI)
- Type hints with Pydantic
- Async support
- Easy to learn
- Perfect for React frontend

**Example Structure:**
```
backend/
├── presentation/
│   ├── routers/
│   └── main.py
├── business/
│   └── services/
├── data/
│   ├── models/
│   └── repositories/
├── requirements.txt
└── .env
```

### Option 2: Django + Django REST Framework
**Pros:**
- Batteries included (admin panel, ORM, auth)
- Robust and mature
- Great for rapid development
- Built-in admin interface

**Example Structure:**
```
backend/
├── classifi_api/         (Django project)
├── presentation/         (Django app)
├── business/             (Django app)
├── data/                 (Django app)
├── manage.py
└── requirements.txt
```

### Option 3: Flask
**Pros:**
- Lightweight and flexible
- Minimal and simple
- Good for learning

**Cons:**
- More manual setup required
- Less built-in features

## Getting Started

> **Note**: Backend implementation is in progress. This README will be updated with setup instructions once the backend structure is created.

### Prerequisites

- Python 3.11+ (recommended)
- pip or Poetry for package management
- PostgreSQL / MySQL / SQLite (TBD)
- Virtual environment (venv or conda)

### Setup Instructions (Coming Soon)

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run development server
# FastAPI:
uvicorn presentation.main:app --reload
# Django:
python manage.py runserver
# Flask:
flask run
```

## API Documentation

API documentation will be automatically generated:
- **FastAPI**: Available at `/docs` (Swagger UI) and `/redoc` (ReDoc)
- **Django REST Framework**: Available via DRF browsable API
- **Flask**: Manual documentation or use Flask-RESTX

## Technology Stack (Recommended: FastAPI)

- **Framework**: FastAPI
- **ORM**: SQLAlchemy
- **Validation**: Pydantic
- **Authentication**: JWT (python-jose, passlib)
- **Database**: PostgreSQL / MySQL / SQLite
- **Testing**: pytest
- **ASGI Server**: Uvicorn
- **Database Migrations**: Alembic

## Project Structure (Planned - FastAPI)

```
backend/
├── presentation/              # Presentation Layer
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py           # Auth endpoints
│   │   └── users.py          # User endpoints
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py           # Auth request/response schemas
│   │   └── user.py           # User schemas
│   ├── middleware/
│   │   └── auth.py           # JWT middleware
│   └── main.py               # FastAPI app initialization
│
├── business/                  # Business Logic Layer
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py   # Auth business logic
│   │   └── user_service.py   # User business logic
│   ├── validation/
│   │   └── auth_validation.py # Validation rules
│   └── models/
│       └── domain_models.py  # Domain models (not DB models)
│
├── data/                      # Data Access Layer
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py           # SQLAlchemy models
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── base.py           # Base repository
│   │   └── user_repository.py # User data access
│   └── database.py           # Database connection
│
├── shared/                    # Shared utilities
│   ├── config.py             # Configuration
│   └── utils.py              # Helper functions
│
├── alembic/                   # Database migrations
│   └── versions/
│
├── tests/                     # Tests
│   ├── test_auth.py
│   └── test_users.py
│
├── .env                       # Environment variables
├── .env.example              # Example environment file
├── requirements.txt          # Python dependencies
├── alembic.ini              # Alembic config
└── README.md                # This file
```

## Dependencies (requirements.txt example for FastAPI)

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
pydantic==2.5.3
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
alembic==1.13.1
psycopg2-binary==2.9.9  # For PostgreSQL
pytest==7.4.4
pytest-asyncio==0.23.3
```

## Related Documentation

- [Frontend README](../frontend/README.md)
- [Architecture Documentation](../docs/architecture/)
- [API Documentation](../docs/api-documentation/)
