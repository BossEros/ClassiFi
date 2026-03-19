# School ID Rollback Implementation Plan

## Goal

Restore the application to the pre-`schoolId` baseline that already exists in `HEAD` so tomorrow's demo uses the original primary-key-based behavior.

## Decision Summary

- Apply a full rollback across backend, frontend, tests, and local schema artifacts.
- Restore previous UI behavior instead of replacing removed `schoolId` fields with new numeric-ID columns.
- Preserve unrelated dirty changes already present in touched files.

## Execution Steps

1. Replace rollback trackers so the current task is documented clearly.
2. Remove backend `schoolId` schema, DTO, repository, service, mapper, controller, and admin-enrollment additions.
3. Remove frontend `schoolId` types, schemas, registration/settings/table UI additions, and any layout changes made to support them.
4. Update focused tests and fixtures to match the restored baseline.
5. Delete the local `school_id` migration artifact.
6. Verify with search, backend checks, and frontend checks.
