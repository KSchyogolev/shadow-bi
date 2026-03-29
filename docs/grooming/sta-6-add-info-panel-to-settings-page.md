# ADR: Add info panel to Settings page

**Issue:** [STA-6](linear://issue/STA-6)  
**Date:** 2026-03-29  
**Status:** Draft

---

# Grooming Artifact: STA-6 — Add info panel to Settings page

## Context

The Settings page contains three configuration cards (`ProjectSyncCard`, `StatusPhaseMappingCard`, `TeamMappingCard`) that must be completed in a specific order. Currently, there's no onboarding guidance — only a generic "Manage project data synchronization" description in the `PageHeader` (see: `apps/web/src/widgets/settings-panel/ui/index.tsx:18`).

New users don't understand the workflow: why sync is needed, what phases mean, how status order affects cycle time, or why roles matter for metrics.

**Solution:** Add a static info panel widget between `PageHeader` and `ProjectSyncCard` that explains the 3-step workflow.

---

## Code Analysis Summary

**Files analyzed:**
- `apps/web/src/pages/settings/ui/index.tsx` — thin page wrapper (6 lines), delegates entirely to `SettingsPanel` widget
- `apps/web/src/widgets/settings-panel/ui/index.tsx` — main composition widget (39 lines, medium complexity), uses `space-y-8` layout, renders PageHeader → ProjectSyncCard → conditional grid with mapping cards
- `apps/web/src/shared/ui/card.tsx` — Card component family (57 lines), standard styling `rounded-xl border border-border bg-card`, exports Card/CardHeader/CardTitle/CardDescription/CardContent/CardFooter
- `apps/web/src/widgets/settings-panel/index.ts` — barrel export pattern: `export { SettingsPanel } from "./ui";`
- `apps/web/src/features/sync-project/ui/index.tsx` — example of Card usage with CardHeader/CardTitle/CardContent composition

**Patterns discovered:**
- FSD widget structure: `widgets/<name>/index.ts` + `widgets/<name>/ui/index.tsx`
- Pages are thin wrappers importing a single widget
- All cards use shared `Card` component with consistent border/shadow styling
- `cn()` utility from `@/shared/lib/cn` used for className merging

**Reusable components found:**
- `Card`, `CardContent` from `@/shared/ui/card.tsx` — will use for panel container
- `cn` utility for conditional classes
- Existing `text-sm text-muted-foreground` pattern matches AC styling requirements

**How analysis influenced the plan:**
The existing widget barrel export pattern (`index.ts` → `ui/index.tsx`) is consistent across `settings-panel` and `summary-cards`, so the new `settings-info-panel` widget will follow the same convention. The `SettingsPanel` uses `space-y-8` gap, so inserting the new panel after `PageHeader` will automatically get proper spacing without layout changes.

---

## Decision

**We will create a new FSD widget `settings-info-panel/`** with a single presentational component that uses the existing `Card` from `@/shared/ui`. The panel will be inserted into `SettingsPanel` between `PageHeader` and `ProjectSyncCard`.

**Rationale:**
- Follows FSD conventions observed in `widgets/settings-panel/` and `widgets/summary-cards/` (see: `apps/web/src/widgets/settings-panel/index.ts`)
- Reuses existing `Card` component rather than creating new primitives (see: `apps/web/src/shared/ui/card.tsx`)
- Minimal blast radius: only `SettingsPanel` needs modification (1 import + 1 render line)
- No state management needed — purely presentational

---

## Steps

1. **Create** `apps/web/src/widgets/settings-info-panel/ui/index.tsx` — component with 3-step grid using `Card` + `CardContent`, responsive `grid grid-cols-1 lg:grid-cols-3`, background override `bg-muted/50`
2. **Create** `apps/web/src/widgets/settings-info-panel/index.ts` — barrel export: `export { SettingsInfoPanel } from "./ui";`
3. **Modify** `apps/web/src/widgets/settings-panel/ui/index.tsx:1` — add import: `import { SettingsInfoPanel } from "@/widgets/settings-info-panel";`
4. **Modify** `apps/web/src/widgets/settings-panel/ui/index.tsx:20` — insert `<SettingsInfoPanel />` after `PageHeader` closing tag, before `<div className="max-w-xl">`
5. **Create** `apps/web/src/widgets/settings-info-panel/__tests__/SettingsInfoPanel.test.tsx` — render test verifying 3 steps are present with correct text

---

## Risks

| Severity | Risk | Mitigation |
|----------|------|------------|
| **Low** | Step copy may need revision after UX review | Copy is static strings in component — easy to update in one place |
| **Low** | `bg-muted/50` may not match design system in dark mode | Verify against existing `bg-muted` usages; AC explicitly specifies this class |
| **Low** | Panel may feel redundant to experienced users | AC explicitly states no dismiss/collapse — out of scope, can revisit in future iteration |

---

## Questions / Unknowns

**Design/UX:**
- [ ] Confirm the exact step copy with PM (current text from AC — is it final?)
- [ ] Should step numbers have a visual treatment (e.g., circled numbers, badge styling) or plain text with `font-medium`?

**Business logic:**
- [ ] No blocking questions — panel is static content

**Technical:**
- [ ] Confirm `bg-muted/50` renders correctly in both light and dark themes before merging (manual QA check)

---

## Estimate

| Step | Hours |
|------|-------|
| 1. Create SettingsInfoPanel component UI | 1.5h |
| 2. Create barrel export | 0.25h |
| 3–4. Integrate into SettingsPanel | 0.5h |
| 5. Write unit test | 1h |
| QA / self-review | 0.5h |
| **Total** | **~4h** |