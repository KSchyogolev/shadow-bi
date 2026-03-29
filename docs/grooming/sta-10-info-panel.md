# ADR: Info Panel

**Issue:** [STA-10](linear://issue/STA-10)  
**Date:** 2026-03-29  
**Status:** Draft

---

## Context

The Settings page (`apps/web/src/widgets/settings-panel/ui/index.tsx:1-39`) orchestrates a 3-step workflow across `ProjectSyncCard`, `StatusPhaseMappingCard`, and `TeamMappingCard`. Currently, the only guidance is a generic `PageHeader` description: "Manage project data synchronization" (see: `apps/web/src/widgets/settings-panel/ui/index.tsx:15-18`). New users lack visibility into the required sequence and meaning of each configuration step.

The codebase follows FSD architecture with a clear separation: `@/shared/ui` contains generic primitives like `Card`, `CardHeader`, `CardContent` (see: `apps/web/src/shared/ui/card.tsx:1-57`), while widget-specific UI lives within the widget folder itself.

The existing `Card` component (see: `apps/web/src/shared/ui/card.tsx:6-16`) provides the visual foundation—rounded borders, shadow, and consistent spacing—which should be reused to maintain design coherence.

## Decision

**Create `SettingsInfoPanel` as a local component within `widgets/settings-panel`**, not in `@/shared/ui`.

Rationale:
1. The content is highly specific to the Settings workflow—not reusable elsewhere.
2. FSD convention: widget-specific UI belongs inside the widget, matching the existing structure where `SettingsPanel` imports from `@/shared/ui` for generic primitives only (see: `apps/web/src/widgets/settings-panel/ui/index.tsx:6`).
3. The component will compose `Card` + `CardContent` from `@/shared/ui` for visual consistency rather than duplicating styles.

**Structure**: A static functional component rendering 3 numbered steps inside a single `Card`. Each step uses a consistent layout: step number badge → title (bold) → description (muted). This mirrors the visual rhythm of existing cards like `ProjectSyncCard` which use `CardHeader` + `CardTitle` patterns (see: `apps/web/src/features/sync-project/ui/index.tsx:32-35`).

**Files to change**:
| Action | Path |
|--------|------|
| Create | `apps/web/src/widgets/settings-panel/ui/settings-info-panel.tsx` |
| Modify | `apps/web/src/widgets/settings-panel/ui/index.tsx` — import and render `SettingsInfoPanel` between `PageHeader` and `ProjectSyncCard` |
| Create | `apps/web/src/widgets/settings-panel/ui/settings-info-panel.test.tsx` |

## Risks

| Severity | Risk | Mitigation |
|----------|------|------------|
| Low | Panel may feel visually heavy on small screens when combined with existing cards | Use responsive padding (`p-4 md:p-6`) and test on mobile viewport; panel is full-width so it naturally adapts |
| Low | Step text becomes stale if workflow changes | Co-locate content with the widget it describes; add code comment referencing this issue for future updates |