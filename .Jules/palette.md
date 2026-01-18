## 2024-05-22 - Accessibility in Icon-only Buttons
**Learning:** Icon-only buttons (like the ''More'' menu) are often invisible to screen readers if they rely solely on SVG icons.
**Action:** Always add a configurable ''aria-label'' prop to such components (e.g., ''triggerLabel'' in DropdownMenu) and provide a sensible default.
