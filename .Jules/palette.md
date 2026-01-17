## 2025-02-21 - Dynamic Toast Roles
**Learning:** Hardcoded `role="alert"` on all toasts creates unnecessary urgency for success messages. Dynamic switching between `alert` (error) and `status` (success/info) is required for a balanced screen reader experience.
**Action:** Audit other feedback components for similar static role assignments.

## 2025-02-21 - Pause on Hover
**Learning:** Auto-dismissing toasts without pause-on-hover violates WCAG 2.2.1 (Timing Adjustable).
**Action:** Always implement `onMouseEnter`/`onMouseLeave` handlers for auto-dismissing notifications.
