# ADR: Info panel TEST

**Issue:** [STA-18](linear://issue/STA-18)  
**Date:** 2026-03-30  
**Status:** Draft

---

# Architecture Plan: STA-18 — Info Panel for Settings Workflow

## Context

The Settings page (`apps/web/src/widgets/settings-panel/ui/index.tsx:1-39`) renders three configuration cards in sequence: `ProjectSyncCard`, `StatusPhaseMappingCard`, and `TeamMappingCard`. Users must complete these in order, but there is no onboarding guidance — only a generic "Manage project data synchronization" description in `PageHeader` (see: `apps/web/src/widgets/settings-panel/ui/index.tsx:14-17`).

The codebase follows Feature-Sliced Design (FSD). Existing shared UI primitives include:
- `Card` family components with consistent styling (see: `apps/web/src/shared/ui/card.tsx:6-10`) — `rounded-xl border border-border bg-card`
- `PageHeader` for page titles (see: `apps/web/src/shared/ui/page-header.tsx:1-15`)
- `InfoBadge` for tooltip-style hints (see: `apps/web/src/shared/ui/info-badge.tsx:1-25`) — out of scope per requirements

The `SettingsPanel` widget has medium complexity (39 lines, 2 functions — see: complexity analysis) and imports from `@/shared/ui` for reusable components. Blast radius is contained since `SettingsPanel` has no dependents.

## Decision Drivers

- **FSD compliance**: new UI should follow existing layer conventions (shared → features → widgets)
- **Single responsibility**: panel is settings-specific, not a generic component
- **Minimal blast radius**: avoid modifying shared primitives used elsewhere
- **Testability**: component should be unit-testable in isolation
- **Consistency**: use existing Card styling patterns for visual cohesion

## Considered Options

### Option 1: Add inline JSX directly in SettingsPanel

Embed the workflow panel markup directly in `SettingsPanel` without creating a separate component.

- **What it is**: Add ~30 lines of JSX between `PageHeader` and `ProjectSyncCard` (see: `apps/web/src/widgets/settings-panel/ui/index.tsx:13-18`)
- **Pros**: 
  - Zero new files
  - Fastest implementation
- **Cons**: 
  - Increases widget complexity (currently 39 lines → ~70 lines)
  - Not unit-testable in isolation
  - Violates FSD — widgets should compose features/entities, not contain bespoke UI
- **Effort**: ~1 hour

### Option 2: Create feature module `settings-workflow-info`

Create a dedicated feature slice with the `SettingsWorkflowPanel` component, following existing feature patterns like `sync-project` and `map-status-phase`.

- **What it is**: New feature at `apps/web/src/features/settings-workflow-info/` with:
  - `ui/SettingsWorkflowPanel.tsx` — the panel component
  - `index.ts` — public API export
- **Pros**:
  - FSD-compliant (features contain domain-specific UI)
  - Matches existing feature structure (see: `apps/web/src/features/sync-project/ui/index.tsx`)
  - Unit-testable in isolation
  - Future-proof for interactivity (collapse, dismiss) if requirements change
- **Cons**:
  - More files for a static component
  - Slight overhead for feature barrel export
- **Effort**: ~3 hours

### Option 3: Create shared UI component `WorkflowInfoPanel`

Add a generic, reusable workflow panel to `@/shared/ui/`.

- **What it is**: New file `apps/web/src/shared/ui/workflow-info-panel.tsx` accepting steps as props
- **Pros**:
  - Reusable across other pages if needed
  - Keeps shared/ui as the UI primitive layer
- **Cons**:
  - YAGNI — no other pages need this currently
  - Shared layer shouldn't contain domain-specific content (step labels are settings-specific)
  - Would need to pass step data as props, adding indirection
- **Effort**: ~2.5 hours

## Decision

**We will use Option 2: Create feature module `settings-workflow-info`**

Rationale:
1. Follows FSD conventions observed in existing features like `sync-project` (see: `apps/web/src/features/sync-project/ui/index.tsx:1-127`) and `map-member-role` (see: `apps/web/src/features/map-member-role/ui/index.tsx`)
2. The `SettingsPanel` widget already composes multiple features (see: `apps/web/src/widgets/settings-panel/ui/index.tsx:3-5`) — adding another feature import is idiomatic
3. Reuses `Card` primitives from `@/shared/ui/card.tsx` for visual consistency with existing cards
4. Component can be tested independently, matching test patterns for other features

## Consequences

### Positive
- Clean separation: widget remains a compositor, feature owns the UI
- Consistent with existing codebase patterns (features export UI components)
- Easy to extend if interactivity is added later (collapse state would live in feature)
- Single owner (Konstantin Shchegolev) for all affected files simplifies review

### Negative / Trade-offs
- Adds 2 new files for a static component (acceptable for FSD compliance)
- Slightly longer import path in `SettingsPanel`

### Risks

| Severity | Risk | Mitigation |
|----------|------|------------|
| Low | Visual inconsistency with existing cards | Use identical `Card` + Tailwind classes from `@/shared/ui/card.tsx:6-10`; verify in subtask 5 |
| Low | Step text doesn't match actual workflow | Copy exact text from AC; reviewer validates against existing card behaviors |

---

## Files to Change

```mermaid
graph TD
    A[apps/web/src/features/settings-workflow-info/ui/SettingsWorkflowPanel.tsx] -->|create| B[New component]
    C[apps/web/src/features/settings-workflow-info/index.ts] -->|create| D[Public export]
    E[apps/web/src/widgets/settings-panel/ui/index.tsx] -->|modify| F[Import & render panel]
    G[apps/web/src/features/settings-workflow-info/ui/SettingsWorkflowPanel.test.tsx] -->|create| H[Unit tests]
    
    A -->|imports| I[@/shared/ui Card]
    E -->|imports| A
```

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/features/settings-workflow-info/ui/SettingsWorkflowPanel.tsx` | Create | Static panel with 3 numbered steps using `Card` primitives |
| `apps/web/src/features/settings-workflow-info/index.ts` | Create | Barrel export: `export { SettingsWorkflowPanel } from "./ui/SettingsWorkflowPanel"` |
| `apps/web/src/widgets/settings-panel/ui/index.tsx` | Modify | Import `SettingsWorkflowPanel`, render between `PageHeader` and `ProjectSyncCard` (line 18) |
| `apps/web/src/features/settings-workflow-info/ui/SettingsWorkflowPanel.test.tsx` | Create | Unit tests: renders 3 steps, correct text content, accessibility |