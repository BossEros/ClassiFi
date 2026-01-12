---
description: Setup development environment from scratch
---

# Setup Development Environment

Run this to initialize the project or reset your environment.

1. Install Dependencies (Frontend)
   // turbo
2. cd frontend && npm install

3. Install Dependencies (Backend)
   // turbo
4. cd backend-ts && npm install

5. Environment Variables

   - Ensure `frontend/.env` exists (copy .env.example)
   - Ensure `backend-ts/.env` exists (copy .env.example)

6. Database Setup

   - Ensure `backend-ts/drizzle.config.ts` exists.
   - Run migrations to set up the DB schema.
     // turbo
   - cd backend-ts && npx drizzle-kit migrate

7. Start Development Servers
   - Terminal 1: `cd backend-ts && npm run dev`
   - Terminal 2: `cd frontend && npm run dev`
