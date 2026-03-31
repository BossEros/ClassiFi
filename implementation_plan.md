# Implementation Plan

## Goal
Fix the desktop profile dropdown so the settings and sign out menu is not visually covered by dashboard cards.

## Approach
1. Inspect the shared sidebar/profile dropdown implementation and preserve the existing dashboard architecture.
2. Keep the default desktop-expanded sidebar menu anchored within the profile trigger container.
3. Preserve a floating desktop menu only for collapsed sidebar mode, where the trigger no longer has enough width.
4. Add regression tests for desktop-expanded and desktop-collapsed behaviors.
5. Run the frontend build to verify the change.
