## 2024-05-22 - Icon-Only Buttons Accessibility
**Learning:** Icon-only buttons (like `DropdownMenu` triggers) are invisible to screen readers without explicit `aria-label`s. Relying on default context isn't enough.
**Action:** Always add a configurable `triggerLabel` (or similar) prop to components wrapping icon-only buttons, defaulting to a generic but helpful term like "Actions", but allowing specific context (e.g., "Class Actions").

## 2024-05-23 - Toast Accessibility & UX
**Learning:** Toast notifications often disappear too quickly for users to read, and using `role="alert"` for everything can be intrusive for non-critical updates.
**Action:** Implement "pause-on-hover" for auto-dismissing toasts and distinguish between `role="alert"` (errors) and `role="status"` (success/info) to improve screen reader experience.
