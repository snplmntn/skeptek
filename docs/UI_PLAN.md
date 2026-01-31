# IMPL PLAN: Mobile Responsiveness Audit (UI/UX Pro Max)

**Status:** Draft
**Goal:** Ensure verified "Glassmorphism" look works perfectly on mobile (iPhone SE to Pixel 8 Pro sizes).

## 1. Audit Target
We will inspect and fix the following pages:

### Core Pages
1.  **Home** (`app/page.tsx`)
    -   *Risk:* Hero section text sizing, grid layouts for "Scouts", footer overlap.
2.  **How It Works** (`app/how-it-works/page.tsx`)
    -   *Risk:* Timeline alignment, long text blocks.
3.  **Login** (`app/login/page.tsx`)
    -   *Risk:* Card centering, input width.
4.  **Compare** (`app/compare/page.tsx`)
    -   *Risk:* Side-by-side columns on mobile (should be stacked).
5.  **Product Details** (Dynamic)
    -   *Risk:* Large charts, horizontal overflow, "Verdict" card sizing.

## 2. Common Fixes (The "Pro Max" Standard)
-   **Typography**: Use `text-3xl md:text-5xl` for headings.
-   **Layout**: `flex-col md:flex-row` for primary splits.
-   **Spacing**: `px-4 md:px-8` for container padding.
-   **Touch Targets**: Buttons must be at least 44px height (`h-11`).
-   **Horizontal Scroll**: Eliminate it. Use `overflow-x-hidden` or `w-full` with wrapping.

## 3. Execution Tasks
-   [ ] **Home**: Check `<Hero />` and feature grid.
-   [ ] **Compare**: Force vertically stacked cards on `< sm` screens.
-   [ ] **How It Works**: Verify readable line lengths on mobile.
-   [ ] **Global**: Ensure `<Navbar />` works on mobile (hamburger or simplified).
-   [ ] **Visuals**: Verify "Glass" effect (`backdrop-blur`) doesn't lag on mobile (simplify if needed).

## 4. Verification
-   **Manual Code Review**: I will review the Tailwind classes for the listed patterns.
-   **User Verification**: I will ask you to verify the build on your local device/simulator.

## 5. User Review
-   *Note:* I will proceed to **EDIT** mode immediately to inspect and fix files unless you object.
