## 2024-05-22 - Icon-Only Buttons Accessibility
**Learning:** Icon-only buttons (like `DropdownMenu` triggers) are invisible to screen readers without explicit `aria-label`s. Relying on default context isn't enough.
**Action:** Always add a configurable `triggerLabel` (or similar) prop to components wrapping icon-only buttons, defaulting to a generic but helpful term like "Actions", but allowing specific context (e.g., "Class Actions").

## 2025-02-23 - Notification UX & Accessibility
**Learning:** Auto-dismissing toasts can create anxiety or frustration if they vanish while being read. Additionally, indiscriminately using `role="alert"` causes screen readers to aggressively interrupt users for minor updates.
**Action:** Implement "pause-on-hover" for all auto-dismissing notifications. Use `role="status"`/`aria-live="polite"` for success/info messages, and reserve `role="alert"`/`aria-live="assertive"` only for errors.

## 2026-03-05 - Keyboard Traps in Forms
**Learning:** Using `tabIndex={-1}` on interactive elements like "Show Password" toggles or helper links (e.g., "Forgot Password?") creates keyboard traps where only mouse users can interact. This completely blocks keyboard-only users from essential functionality.
**Action:** Never use `tabIndex={-1}` on interactive elements unless they are visually hidden or actively disabled. Ensure all form helpers are in the natural tab order.
