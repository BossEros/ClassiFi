## Teacher Modules View Toggle Bug

1. Inspect the assignments tab view-state logic to confirm why `Modules` cannot activate when a class has zero modules.
2. Remove the forced fallback that keeps the UI stuck in `List` mode and preserve a valid empty `Modules` state.
3. Add targeted unit coverage for switching to `Modules` when no modules exist.
4. Verify the frontend with a typecheck and a focused component test when the environment allows it.
