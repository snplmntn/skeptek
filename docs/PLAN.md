# PLAN: Global Feed Suppression (Option A)

## Context
The Global Feed ("Global Watchtower") currently shows an "Awaiting First Scan Sequence" placeholder when no data is present. Per the brainstorm, we will implement **Total Suppression (Stealth Mode)** to hide the component entirely when empty, ensuring a premium, focused search experience.

## Agents Involved
1. `project-planner` (Planning & Coordination)
2. `frontend-specialist` (Logic Implementation)
3. `performance-optimizer` (Lifecycle & Render Audit)
4. `test-engineer` (Verification)

## Proposed Changes

### [Component] Global Feed
- **File**: `components/global-feed.tsx`
- **Change**: Update the conditional return for empty states.
- **Logic**:
  - Keep the initial `loading` skeleton/indicator if appropriate (or hide that too).
  - If `!loading` and `scans.length === 0`, return `null` instead of the placeholder JSX.

## Verification Plan
1. **Code Audit**: Verify `scans` state is correctly handled during both initial fetch and realtime updates.
2. **Visual Check**: Ensure no weird spacing/gaps remain where the feed used to be.
3. **Script Verification**: Run security and lint scans per orchestration requirements.
