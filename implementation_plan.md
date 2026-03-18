# Student Current Grade Plan

## Goal

Replace the student-facing "Class Average" behavior with a true current grade that reflects actual class standing for the current point in time.

## Decision

Use a points-based current-grade calculation with these rules:

- Include graded assignments using their earned score.
- Include overdue assignments without a submission as `0`.
- Exclude submitted-but-not-yet-graded assignments so students are not penalized while work is pending review.
- Exclude assignments that are not yet due.
- Exclude assignments without a deadline when they are still ungraded and unsubmitted because they are not yet missing.

## Implementation Steps

- Inspect all student-facing grade summaries that currently average graded work only.
- Extract a reusable helper for student grade metrics so the class overview card, grades page, and grade-report PDF stay consistent.
- Rename summary labels/help text from average-oriented wording to current-grade wording where needed.
- Add focused unit tests that cover graded work, overdue missing work, pending review work, and future assignments.
- Run frontend verification and document any failures before closing the task.
