## 2024-05-22 - Icon-Only Buttons Accessibility
**Learning:** Icon-only buttons (like `DropdownMenu` triggers) are invisible to screen readers without explicit `aria-label`s. Relying on default context isn't enough.
**Action:** Always add a configurable `triggerLabel` (or similar) prop to components wrapping icon-only buttons, defaulting to a generic but helpful term like "Actions", but allowing specific context (e.g., "Class Actions").
