## 2024-05-23 - Accessibility of Icon-Only Buttons
**Learning:** Icon-only buttons (like the "More options" dropdown trigger) are a common accessibility trap. They visually work for sighted users but are completely invisible to screen readers without an explicit `aria-label`.
**Action:** Always audit icon-only buttons for `aria-label`. If creating a reusable component, expose a prop (e.g., `triggerLabel`) to allow consumers to provide context-specific labels.
