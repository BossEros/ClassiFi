## 2024-05-22 - Icon-Only Button Accessibility
**Learning:** Interactive components relying solely on icons (like the "More options" dropdown) are invisible to screen readers without explicit labels.
**Action:** Always verify `aria-label` is present on icon-only buttons. Added `triggerLabel` prop to DropdownMenu to enforce this pattern.
