# Implementation Plan: Automatic Similarity Analysis (No New Tables)

## Goal
Automatically trigger assignment similarity analysis after successful student submissions without introducing a queue table or other schema changes.

## Constraints
- Keep existing Controller-Service-Repository architecture.
- Reuse existing plagiarism analysis and report reuse logic.
- No new database tables or migrations.
- Submission flow must remain successful even when scheduling/analysis fails.

## Approach
1. Add an in-memory automation service in the plagiarism module:
- debounced scheduling per assignment on submission events
- single in-progress guard with one pending rerun flag
- periodic reconciliation cycle that checks existing submissions/reports

2. Integrate scheduling from `SubmissionService` after successful submission creation and grading flow.

3. Reuse existing data sources only:
- `submissions` (latest submissions)
- `similarity_reports` (latest report freshness)

4. Start/stop automation lifecycle from `buildApp` and Fastify `onClose`.

## Implementation Steps
1. Extend config with automation flags (enabled, debounce, reconciliation interval, min submissions).
2. Add submission repository helper for latest submission snapshots by assignment.
3. Implement `PlagiarismAutoAnalysisService` under `src/modules/plagiarism`.
4. Register new service in DI tokens and container.
5. Wire service startup/shutdown in `src/app.ts`.
6. Invoke scheduler from `SubmissionService.submitAssignment` with fail-safe error handling.
7. Add/adjust service unit tests.
8. Update backend documentation with automated similarity behavior and config.
9. Verify with `npm run typecheck` and `npm test`.

## Risks and Mitigation
- Risk: in-memory timers are lost on restart.
- Mitigation: reconciliation cycle catches stale/missing reports and re-triggers analysis.

- Risk: duplicate runs when submissions are frequent.
- Mitigation: per-assignment debounce + in-progress coalescing with single rerun flag.

- Risk: slower submission if analysis is in critical path.
- Mitigation: scheduling only, analysis remains asynchronous and non-blocking for submit response.
