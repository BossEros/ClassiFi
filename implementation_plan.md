# Implementation Plan

## Goal
Fix the confirmed notification, PDF metadata, and API-response robustness issues without breaking the existing backend service/repository and frontend clean-architecture patterns.

## Approach
1. Add a shared backend utility for logging rejected `Promise.allSettled` results so background notification flows remain DRY and observable.
2. Update enrollment flows to emit the real enrollment record ID in `ENROLLMENT_CONFIRMED` payloads.
3. Fix similarity-detection notifications so teachers receive the actual detected similarity percentage rather than the deduction percentage.
4. Correct PDF metadata and cross-class qualitative signal derivation in the plagiarism export builders.
5. Harden `unwrapApiResponse` call sites that currently rely on non-null assertions for required payload fields.
6. Extend targeted backend and frontend tests, then run backend typecheck/tests and frontend build/tests relevant to the changed surfaces.
