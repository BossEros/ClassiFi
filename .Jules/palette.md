## 2024-05-22 - Icon-Only Buttons Accessibility
**Learning:** Icon-only buttons (like `DropdownMenu` triggers) are invisible to screen readers without explicit `aria-label`s. Relying on default context isn't enough.
**Action:** Always add a configurable `triggerLabel` (or similar) prop to components wrapping icon-only buttons, defaulting to a generic but helpful term like "Actions", but allowing specific context (e.g., "Class Actions").

## 2024-05-23 - Toast Accessibility & Interaction
**Learning:** Users often need more time to read notifications. Adding "pause-on-hover" to auto-dismissing toasts significantly improves usability without requiring complex user settings. Also, distinguishing between `role="alert"` (errors) and `role="status"` (success) prevents screen readers from aggressively interrupting users for non-critical updates.
**Action:** Ensure all auto-dismissing transient UI elements (toasts, snackbars) support pause-on-hover and use semantic ARIA roles based on message severity.
