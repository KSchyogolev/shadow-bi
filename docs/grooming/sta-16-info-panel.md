# ADR: Info Panel

**Issue:** [STA-16](linear://issue/STA-16)  
**Date:** 2026-03-30  
**Status:** Draft

---

# Architecture Plan: STA-16 — Info Panel

## Context

The Settings page (`SettingsPanel`) currently renders three feature cards in a specific workflow order — sync project, map statuses, assign roles — but provides no guidance for new users (see: apps/web/src/widgets/settings-panel/ui/index.tsx:17-19). The only hint is the PageHeader description "Manage project data synchronization" (see: apps/web/src/widgets/settings-panel/ui/index.tsx:18).

The codebase already has established patterns for informational UI:
- **Card primitives** (`Card`, `CardHeader`, `CardContent`) provide consistent container styling (see: apps/web/src/shared/ui/card.tsx:6-14)
- **InfoRow** handles label-value pairs (see: apps/web/src/shared/ui/info-row.tsx:1-15)
- **InfoBadge** provides tooltip-style help (see: apps/web/src/shared/ui/info-badge.tsx:1-25)

However, none of these fit a numbered-steps workflow panel. A new component is needed.

## Decision

**Create a new `SetupWorkflowPanel` component in `@/shared/ui`** that renders static numbered steps using existing Card styling conventions.

Rationale:
1. **Follows FSD layer separation** — presentational components belong in `shared/ui` (see: apps/web/src/shared/ui/card.tsx, apps/web/src/shared/ui/info-row.tsx patterns)
2. **Reuses Card styling tokens** — `border-border`, `bg-card`, `rounded-xl` maintain visual consistency (see: apps/web/src/shared/ui/card.tsx:10-12)
3. **Single integration point** — only `SettingsPanel` needs modification (see: apps/web/src/widgets/settings-panel/ui/index.tsx:17-19)
4. **Props-driven content** — step data passed as props allows future reuse if similar patterns emerge

**Files to change:**

| Action | File |
|--------|------|
| Create | `apps/web/src/shared/ui/setup-workflow-panel.tsx` |
| Modify | `apps/web/src/shared/ui/index.ts` (add export) |
| Modify | `apps/web/src/widgets/settings-panel/ui/index.tsx` (integrate) |

**Component API:**

```tsx
interface WorkflowStep {
  number: number;
  title: string;
  description: string;
}

interface SetupWorkflowPanelProps {
  steps: WorkflowStep[];
}
```

## Risks

| Severity | Risk | Mitigation |
|----------|------|------------|
| Low | Step content hardcoded in widget may need i18n later | Accept for now — out of scope per AC; content passed via props enables future extraction |
| Low | Panel width may conflict with `max-w-xl` constraint on cards below | Use full container width (no max-w constraint) as specified in AC, matching parent `space-y-8` layout |