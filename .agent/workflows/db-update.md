---
description: Update database schema using Drizzle ORM
---

# Database Schema Update

Follow this workflow when modifying the database structure.

1. Edit Models

   - Modify files in `backend-ts/src/models/`
   - Define new tables or columns using Drizzle schema.

2. Generate Migrations

   - Run the generate command to create SQL files.
     // turbo
   - cd backend-ts && npx drizzle-kit generate

3. Review SQL

   - Check the generated SQL files in `backend-ts/drizzle/` to ensure they are correct.

4. Apply Migrations

   - Apply the changes to your local database.
     // turbo
   - cd backend-ts && npx drizzle-kit migrate

5. Update Client
   - If you changed public types, run type checking to catch errors.
     // turbo
   - cd backend-ts && npm run typecheck
