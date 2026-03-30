# ADR: Add info panel to Settings page

**Issue:** [STA-6](linear://issue/STA-6)  
**Date:** 2026-03-30  
**Status:** Draft

---

- **Pros**: Reusable across pages; follows FSD shared/ui conventions; composable API
- **Cons**: Slightly more upfront work than inline solution
- **Effort**: ~3.5h

### Option 2: Extend `PageHeader` with optional `steps` prop

Modify `PageHeader` (see: apps/web/src/shared/ui/page-header.tsx:1-15) to accept an optional `steps` array and render them below the description.

- **Pros**: No new component; single integration point
- **Cons**: Violates single responsibility; `PageHeader` becomes bloated; steps UI tightly coupled to header styling; other pages using `PageHeader` gain unused complexity
- **Effort**: ~2h

### Option 3: Inline panel directly in `SettingsPanel`

Add the panel markup directly in `SettingsPanel` without creating a reusable component.

- **Pros**: Fastest implementation; no shared/ui changes
- **Cons**: Not reusable; violates FSD principle of UI primitives in shared layer; harder to maintain consistent styling if similar panels needed elsewhere
- **Effort**: ~1.5h

## Decision

**We will use Option 1: New `InfoPanel` component in `@/shared/ui`**

This aligns with the established pattern where UI primitives live in `shared/ui` as thin wrappers (see: apps/web/src/shared/ui/card.tsx:5-16). The composable API (`InfoPanel` + `InfoPanelStep`) mirrors the `Card` + `CardHeader` + `CardContent` pattern, making it intuitive for developers already familiar with the codebase.

The component will use a light blue background with the `Info` icon from lucide-react (already a project dependency used in `InfoBadge` — see: apps/web/src/shared/ui/info-badge.tsx:1), providing visual distinction from the white `Card` components while maintaining design consistency.