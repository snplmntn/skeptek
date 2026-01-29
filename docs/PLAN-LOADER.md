# PLAN: Restore Loader Animations

## Context
The user wants to ensure the "ForensicLensLoader" plays its full animation cycle, specifically highlighting the "lens" animation (single mode) and ensuring "versus" and "review" modes work as intended. Currently, fast backend responses might be cutting the animation short.

## Agents Involved
1. `project-planner` (Planning)
2. `frontend-specialist` (Implementation)
3. `test-engineer` (Verification)

## Proposed Changes

### [Component] Forensic Lens Loader
- **File**: `components/forensic-lens-loader.tsx`
- **Change**: Implement a minimum animation duration to ensure the "investigation" phase (lens animation) is visible even if the backend returns data immediately.
- **Change**: Verify `mode="single"` renders the "Lens" correctly.

### [Page] App Page
- **File**: `app/page.tsx`
- **Change**: Pass the correct mode. (Already looks correct, but will double check logic).

### Detailed Steps
1.  **Enforce Minimum Duration**: Add logic in `ForensicLensLoader` to delay `isFinishing` visual transition until a minimum time (e.g., 2 full loops or 5 seconds) has passed.
2.  **Verify Lens Drawing**: Code audit of the canvas drawing for "Standard Single Lens" to ensure it matches "the one with lens".
3.  **Refine "Versus" and "Review"**: Ensure strict mode checking.

## Verification Plan
1.  **Code Review**: Check for logical errors in `useEffect`.
2.  **Lint / Type Check**: Run strict type checks.
