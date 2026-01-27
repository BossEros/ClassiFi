## 2024-05-22 - Icon-Only Buttons Accessibility
**Learning:** Icon-only buttons (like `DropdownMenu` triggers) are invisible to screen readers without explicit `aria-label`s. Relying on default context isn't enough.
**Action:** Always add a configurable `triggerLabel` (or similar) prop to components wrapping icon-only buttons, defaulting to a generic but helpful term like "Actions", but allowing specific context (e.g., "Class Actions").

## 2025-02-23 - Notification UX & Accessibility
**Learning:** Auto-dismissing toasts can create anxiety or frustration if they vanish while being read. Additionally, indiscriminately using `role="alert"` causes screen readers to aggressively interrupt users for minor updates.
**Action:** Implement "pause-on-hover" for all auto-dismissing notifications. Use `role="status"`/`aria-live="polite"` for success/info messages, and reserve `role="alert"`/`aria-live="assertive"` only for errors.

## 2025-02-24 - Form Validation Consistency
**Learning:** Inconsistent error states across form inputs (e.g., `Input` vs `Select`) confuse users and break mental models. If one field glows red on error, all fields must behave similarly.
**Action:** Ensure all form components (`Input`, `Select`, `Textarea`, etc.) implement a consistent `hasError` prop that drives both visual feedback (red border) and accessibility attributes (`aria-invalid`).
