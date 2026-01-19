---
description: Verify codebase health by running frontend build and backend tests
---

# Verify Codebase Health

Run this workflow to ensure recent changes have not introduced build errors or regressions.

1. Verify Frontend (Build & Typecheck)
   // turbo
2. cd frontend && npm run build

3. Verify Backend (Typecheck)
   // turbo
4. cd backend-ts && npm run typecheck

5. Verify Backend (Unit Tests)
   // turbo
6. cd backend-ts && npm run test
