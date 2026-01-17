## 2026-01-16 - Icon-Only Button Accessibility
**Learning:** Icon-only buttons (like in `DropdownMenu`) are major accessibility barriers if they lack labels.
**Action:** Always add `aria-label` to icon-only buttons. For reusable components, expose a prop (e.g., `triggerLabel`) to allow context-specific labeling.
