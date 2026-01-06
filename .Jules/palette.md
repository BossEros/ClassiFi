## 2024-05-23 - Dropdown Accessibility and Defaults
**Learning:** Generic components like `DropdownMenu` often suffer from "icon-only button" accessibility issues because their context isn't known at definition time.
**Action:** Always provide a sensible default `aria-label` (e.g., "More options") for generic icon triggers, but expose a prop (e.g., `triggerLabel`) so consumers can provide specific context (e.g., "Class options"). Also, explicitly set `type="button"` on generic UI buttons to prevent accidental form submissions.
