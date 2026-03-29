# ADR: Info Panel on settings page

**Issue:** [STA-8](linear://issue/STA-8)  
**Date:** 2026-03-29  
**Status:** Draft

---

## Architecture Plan

### Context

The Settings page in `SettingsPanel` widget (see: apps/web/src/widgets/settings-panel/ui/index.tsx:1-39) renders three configuration cards in sequence: `ProjectSyncCard`, `StatusPhaseMappingCard`, and `TeamMappingCard`. Currently, the only guidance is a generic subtitle in `PageHeader` — "Manage project data synchronization" (see: apps/web/src/widgets/settings-panel/ui/index.tsx:16-17). New users have no visibility into the required workflow order or the purpose of each step.

The codebase follows Feature-Sliced Design with a `@/shared/ui` layer containing primitive components like `Card`, `CardHeader`, `CardTitle`, `CardContent` (see: apps/web/src/shared/ui/card.tsx:1-56). These primitives use Tailwind utility classes and the `cn()` helper for composition. The existing Card pattern demonstrates the project's approach: thin wrapper components with className extension via spread props.

The `SettingsPanel` widget has medium complexity (39 lines, max indent 6) and clean structure — adding a new component between `PageHeader` and `ProjectSyncCard` requires minimal refactoring. All affected files have single ownership (Konstantin Shchegolev), reducing coordination overhead.

### Decision

**Create a new `InfoPanel` component in `@/shared/ui`** that displays numbered workflow steps, then integrate it into `SettingsPanel`.

Rationale:
1. **Shared UI placement** — The component is a presentational primitive (title + ordered steps) with no business logic. This matches the pattern of `Card` and `PageHeader` in `@/shared/ui` (see: apps/web/src/shared/ui/card.tsx, apps/web/src/shared/ui/page-header.tsx). It can be reused for future onboarding flows.

2. **Composition over configuration** — Following the Card pattern (see: apps/web/src/shared/ui/card.tsx:4-15), `InfoPanel` will accept `className` for extension and use semantic sub-components (`InfoPanel`, `InfoPanelStep`) rather than a complex props object with step arrays.

3. **Visual consistency** — Reuse existing design tokens: `border-border`, `bg-card`, `rounded-xl` from Card (see: apps/web/src/shared/ui/card.tsx:8-10), `text-muted-foreground` from PageHeader (see: apps/web/src/shared/ui/page-header.tsx:11).

**Files to change:**
| Action | File |
|--------|------|
| Create | `apps/web/src/shared/ui/info-panel.tsx` |
| Modify | `apps/web/src/shared/ui/index.ts` (add export) |
| Modify | `apps/web/src/widgets/settings-panel/ui/index.tsx` (insert InfoPanel) |
| Create | `apps/web/src/shared/ui/__tests__/info-panel.test.tsx` |

**Component API:**
```tsx
<InfoPanel title="Setup Workflow">
  <InfoPanelStep number={1} title="Sync">
    Select a Jira project and sync its issues, statuses, and team members.
  </InfoPanelStep>
  {/* ... */}
</InfoPanel>
```

### Risks

| Severity | Risk | Mitigation |
|----------|------|------------|
| Low | InfoPanel styling may clash with Card-heavy layout | Use subtle background (`bg-muted/50`) and `border-l-4 border-primary` accent instead of full card border to visually differentiate |
| Low | Step content text may be too long on mobile | Apply `max-w-prose` to step descriptions; verify in responsive dev tools |