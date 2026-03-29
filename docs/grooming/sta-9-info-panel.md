# ADR: Info Panel

**Issue:** [STA-9](linear://issue/STA-9)  
**Date:** 2026-03-29  
**Status:** Draft

---

# Architecture Plan — STA-9: Info Panel

## Context

The Settings page in `SettingsPanel` (see: apps/web/src/widgets/settings-panel/ui/index.tsx:1-39) renders three configuration cards (`ProjectSyncCard`, `StatusPhaseMappingCard`, `TeamMappingCard`) that must be completed in sequence. Currently, the only guidance is a single subtitle in `PageHeader` — "Manage project data synchronization" (see: apps/web/src/widgets/settings-panel/ui/index.tsx:14-15). New users have no visibility into the required workflow or the semantic meaning of phases, IN CYCLE, and roles.

The codebase follows Feature-Sliced Design. Presentational primitives live in `@/shared/ui` — examples: `Card` (see: apps/web/src/shared/ui/card.tsx), `PageHeader` (see: apps/web/src/shared/ui/page-header.tsx), `InfoBadge` (see: apps/web/src/shared/ui/info-badge.tsx). These are stateless, props-driven components with no business logic.

The widget layer (`widgets/settings-panel`) composes features and shared components. Currently it imports `PageHeader` from `@/shared/ui` (see: apps/web/src/widgets/settings-panel/ui/index.tsx:6) and three feature cards.

Blast radius is minimal: `SettingsPanel` has no downstream dependents and medium complexity (39 lines, max indent 6). Sole owner: Konstantin Shchegolev (100%).

## Decision Drivers

- **Consistency**: New component should follow existing `@/shared/ui` patterns (typed props, Tailwind styling, no internal state).
- **Testability**: Component must be unit-testable in isolation without rendering the entire Settings page.
- **Minimal footprint**: Static content, no API calls, no collapse/dismiss state (per Out of Scope).
- **FSD compliance**: Presentational primitives belong in `shared/ui`, not feature slices.

## Considered Options

### Option 1: Internal component inside `widgets/settings-panel`

Create `WorkflowInfoPanel` as a non-exported function within `apps/web/src/widgets/settings-panel/ui/index.tsx`.

- Pros: Zero new files, co-located with usage.
- Cons: Cannot unit-test in isolation; violates separation — widget file grows.
- Effort: ~2h

### Option 2: New component in `@/shared/ui`

Create `apps/web/src/shared/ui/workflow-info-panel.tsx` exporting a generic `<WorkflowInfoPanel steps={[...]} />` component. `SettingsPanel` imports it and supplies steps data.

- Pros: Follows existing pattern (`Card`, `PageHeader`), testable, reusable if future pages need similar guidance.
- Cons: Slight over-abstraction for a single use case.
- Effort: ~3.5h

### Option 3: New feature slice `features/setup-guide`

Create full FSD feature: `apps/web/src/features/setup-guide/ui/index.tsx` + barrel export.

- Pros: Strict FSD hierarchy.
- Cons: Overkill — this is a pure presentational component with zero business logic; FSD reserves `features/` for stateful or behavioral code.
- Effort: ~4h

## Decision

**We will use Option 2: New component in `@/shared/ui`**

Rationale:

1. Aligns with established shared/ui primitives — `Card` (see: apps/web/src/shared/ui/card.tsx:8-19) and `PageHeader` (see: apps/web/src/shared/ui/page-header.tsx) are already props-driven, stateless, and Tailwind-styled.
2. Enables unit tests without mounting `SettingsPanel` or mocking hooks.
3. If another page (e.g., onboarding wizard) needs a similar steps panel, component is ready.
4. Keeps widget file focused on composition, not presentation details.

## Component API

```tsx
// apps/web/src/shared/ui/workflow-info-panel.tsx

export interface WorkflowStep {
  title: string;
  description: string;
}

export interface WorkflowInfoPanelProps {
  steps: WorkflowStep[];
}

export function WorkflowInfoPanel({ steps }: WorkflowInfoPanelProps): JSX.Element;
```

`SettingsPanel` will call:

```tsx
<WorkflowInfoPanel
  steps={[
    { title: "Sync", description: "Select a Jira project and sync its issues, statuses, and team members." },
    { title: "Map Statuses", description: "Drag statuses into the correct order and assign each to a phase (Backlog, Active, Done). Mark which statuses count as IN CYCLE for cycle time calculation." },
    { title: "Assign Roles", description: "Set each team member's role (Dev, QA) to enable per-role metrics on the dashboard. Hit Recalculate Metrics when done." },
  ]}
/>
```

## File Changes

```mermaid
flowchart LR
    subgraph shared/ui
        A[workflow-info-panel.tsx] -- new -->|export| B[index.ts]
    end
    subgraph widgets/settings-panel
        C[ui/index.tsx] -- import WorkflowInfoPanel --> A
    end
```

| Action | File |
|--------|------|
| **Create** | `apps/web/src/shared/ui/workflow-info-panel.tsx` |
| **Modify** | `apps/web/src/shared/ui/index.ts` — add export |
| **Modify** | `apps/web/src/widgets/settings-panel/ui/index.tsx` — import and render between `PageHeader` and `ProjectSyncCard` |
| **Create** | `apps/web/src/shared/ui/__tests__/workflow-info-panel.test.tsx` |

## Consequences

### Positive

- Users see clear 3-step guidance before interacting with cards.
- Component is isolated, testable, and styled consistently with existing UI kit.
- No additional dependencies — uses existing Tailwind classes and `cn()` util (see: apps/web/src/shared/ui/card.tsx:2).

### Negative / Trade-offs

- Adds one more file to `shared/ui` barrel export; negligible bundle impact (static markup).
- Generic interface (`steps` array) may be more flexible than needed for a single caller — accepted for testability.

### Risks

| Severity | Risk | Mitigation |
|----------|------|------------|
| Low | Step copy drifts from actual card functionality after future refactors | Add code comment in `SettingsPanel` linking step text to card features; future card changes should update step descriptions. |
| Low | Styling inconsistency if design tokens change | Use semantic Tailwind classes (`text-muted-foreground`, `bg-muted`) already present in `Card` (see: apps/web/src/shared/ui/card.tsx:11). |