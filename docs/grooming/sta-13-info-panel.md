# ADR: Info Panel

**Issue:** [STA-13](linear://issue/STA-13)  
**Date:** 2026-03-30  
**Status:** Draft

---

# Architecture Plan — STA-13: Info Panel

## Context

The Settings page is rendered by `SettingsPanel` (see: apps/web/src/widgets/settings-panel/ui/index.tsx:1-39), which orchestrates a 3-step workflow across `ProjectSyncCard`, `StatusPhaseMappingCard`, and `TeamMappingCard`. Currently, the only user guidance is a generic `PageHeader` description: "Manage project data synchronization" (see: apps/web/src/widgets/settings-panel/ui/index.tsx:14-17). New users have no visibility into the required sequence, the meaning of phases/IN CYCLE, or why role assignment matters.

The codebase follows Feature-Sliced Design. Generic presentational primitives live in `@/shared/ui` — examples include `Card`, `CardHeader`, `CardTitle`, `CardContent` (see: apps/web/src/shared/ui/card.tsx:1-57) and `InfoBadge` (see: apps/web/src/shared/ui/info-badge.tsx:1-24). These are stateless, reusable components with no business logic. Widget-specific UI that is not reusable belongs within the widget folder itself.

`SettingsPanel` already imports shared primitives via `@/shared/ui` (see: apps/web/src/widgets/settings-panel/ui/index.tsx:6) and has medium complexity (39 lines, max indent 6). Blast radius is minimal — no downstream dependents exist. Single ownership by Konstantin Shchegolev (100%) eliminates coordination overhead.

## Decision

**Create `SettingsInfoPanel` as a local component within `widgets/settings-panel/ui/`**, not in `@/shared/ui`.

Rationale:
1. **Content is workflow-specific** — the panel displays hardcoded step descriptions ("Sync", "Map Statuses", "Assign Roles") tied exclusively to the Settings page. This is not a reusable primitive.
2. **FSD convention** — widget-specific UI belongs inside the widget, matching the existing pattern where `SettingsPanel` imports generic primitives from `@/shared/ui` but owns its layout logic (see: apps/web/src/widgets/settings-panel/ui/index.tsx:11-38).
3. **Reuse existing primitives** — the component will compose `Card`, `CardHeader`, `CardContent` from `@/shared/ui/card.tsx` for visual consistency, following the same pattern used by `ProjectSyncCard` (see: apps/web/src/features/sync-project/ui/index.tsx:30-33).

**Files to change:**

| Action | File |
|--------|------|
| Create | `apps/web/src/widgets/settings-panel/ui/settings-info-panel.tsx` |
| Modify | `apps/web/src/widgets/settings-panel/ui/index.tsx` — import and render `SettingsInfoPanel` between `PageHeader` and `ProjectSyncCard` |
| Create | `apps/web/src/widgets/settings-panel/ui/settings-info-panel.test.tsx` |

## Risks

| Severity | Risk | Mitigation |
|----------|------|------------|
| Low | Panel text becomes stale if workflow changes | Keep step descriptions generic; link future tooltip work (InfoBadge per card) to STA-13 as noted in Out of Scope |
| Low | Panel competes visually with PageHeader | Use muted background variant (`bg-muted/50`) and smaller text (`text-sm`) to establish visual hierarchy below header |