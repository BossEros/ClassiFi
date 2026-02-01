## 2024-05-22 - Icon-Only Buttons Accessibility
**Learning:** Icon-only buttons (like `DropdownMenu` triggers) are invisible to screen readers without explicit `aria-label`s. Relying on default context isn't enough.
**Action:** Always add a configurable `triggerLabel` (or similar) prop to components wrapping icon-only buttons, defaulting to a generic but helpful term like "Actions", but allowing specific context (e.g., "Class Actions").

## 2025-02-23 - Notification UX & Accessibility
**Learning:** Auto-dismissing toasts can create anxiety or frustration if they vanish while being read. Additionally, indiscriminately using `role="alert"` causes screen readers to aggressively interrupt users for minor updates.
**Action:** Implement "pause-on-hover" for all auto-dismissing notifications. Use `role="status"`/`aria-live="polite"` for success/info messages, and reserve `role="alert"`/`aria-live="assertive"` only for errors.

## 2025-02-24 - Keyboard Accessibility in Forms
**Learning:** Interactive elements in forms (like "Forgot password?" links and password visibility toggles) must not be removed from the tab order with `tabIndex={-1}`, as this completely blocks keyboard-only users from accessing them.
**Action:** Always ensure helper buttons are focusable and have clear focus indicators (e.g., `focus-visible:ring-2`).
