## 2024-05-22 - Inconsistent Focus States
**Learning:** Secondary navigation components (like BackButton) were missing focus indicators, making keyboard navigation confusing on dark backgrounds.
**Action:** Always check secondary interactive elements for focus-visible styles, ensuring they contrast well with the specific background (e.g., using ring-gray-400 for dark themes).
