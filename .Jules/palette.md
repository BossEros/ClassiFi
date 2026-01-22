## 2024-05-22 - Icon-Only Buttons Accessibility
**Learning:** Icon-only buttons (like `DropdownMenu` triggers) are invisible to screen readers without explicit `aria-label`s. Relying on default context isn't enough.
**Action:** Always add a configurable `triggerLabel` (or similar) prop to components wrapping icon-only buttons, defaulting to a generic but helpful term like "Actions", but allowing specific context (e.g., "Class Actions").

## 2025-01-22 - Toast Roles and Interactions
**Learning:** Toasts previously defaulted to `role="alert"` for all variants, causing unnecessary screen reader interruptions for non-critical messages. Also, toasts would auto-dismiss even while the user was reading them.
**Action:** Use `role="status"` (polite) for success/info messages and `role="alert"` (assertive) only for errors. Implement pause-on-hover to give users time to read.
