# ADR: Info panel TEST

**Issue:** [STA-18](linear://issue/STA-18)  
**Date:** 2026-03-30  
**Status:** Draft

---

# Architecture Plan: STA-18 — Info panel TEST

## Context

The Settings page orchestrates a 3-step project configuration workflow via `SettingsPanel` (see: apps/web/src/widgets/settings-panel/ui/index.tsx:1-39). Currently, the only guidance is the generic `PageHeader` description "Manage project data synchronization" (see: apps/web/src/widgets/settings-panel/ui/index.tsx:16-17), leaving users without context on:
- The required sequence: Sync → Map Statuses → Assign Roles
- The meaning of phases and IN CYCLE toggle
- When to recalculate metrics

The codebase already has a `Card` component family (see: apps/web/src/shared/ui/card.tsx:1-56) used consistently across all settings cards (`ProjectSyncCard`, `StatusPhaseMappingCard`, `TeamMappingCard`). The `SettingsPanel` widget has medium complexity (39 lines, max indent 6) and a clear insertion point between `PageHeader` and the first card (see: apps/web/src/widgets/settings-panel/ui/index.tsx:18-23).

## Decision

Create a new `SetupWorkflowPanel` component co-located within `widgets/settings-panel/ui/` and insert it into the existing layout. This approach:

1. **Follows FSD layering** — The panel is widget-specific (settings workflow), not a generic shared component. Co-location keeps related code together (see: apps/web/src/widgets/settings-panel/ui/index.tsx imports already scoped to this widget).

2. **Reuses existing Card primitives** — Compose from `Card`, `CardHeader`, `CardContent` (see: apps/web/src/shared/ui/card.tsx:4-13) to maintain visual consistency with adjacent cards.

3. **Minimal blast radius** — Only `SettingsPanel` imports the new component; no changes to shared/ui or features. The widget has no external dependents per dependency analysis.

4. **Static content, no state** — Pure presentational component with hardcoded 3-step content per AC. No hooks, no props initially (can add `steps` prop later if reuse emerges).

**Files to change:**

| File | Action |
|------|--------|
| `apps/web/src/widgets/settings-panel/ui/setup-workflow-panel.tsx` | **Create** — New component with 3 numbered steps using Card primitives |
| `apps/web/src/widgets/settings-panel/ui/index.tsx` | **Modify** — Import and render `SetupWorkflowPanel` between PageHeader and ProjectSyncCard (line 18) |
| `apps/web/src/widgets/settings-panel/index.ts` | **Modify** — Add named export for `SetupWorkflowPanel` |
| `apps/web/src/widgets/settings-panel/ui/setup-workflow-panel.test.tsx` | **Create** — Unit tests for content rendering |

## Risks

| Severity | Risk | Mitigation |
|----------|------|------------|
| Low | Panel may feel visually heavy stacked with existing cards | Use lighter styling (no shadow, muted border) and compact padding; can adjust in review |
| Low | Hardcoded English text blocks i18n later | Accept for now per scope; text is isolated in one component for easy extraction |