---
name: add-ui-component
description: >-
  Add or create UI components following the project's Radix + cva + Tailwind
  pattern (shadcn-style). Use when the user asks to add a UI component, create
  a new shared component, install a shadcn component, or build a reusable
  primitive like dialog, dropdown, tabs, tooltip, or input.
---

# Add UI Component

## Decision: Radix Primitive or Plain HTML?

- **Needs accessibility behavior** (focus traps, portals, keyboard nav, ARIA) → use Radix primitive
- **Pure visual** (card, badge, stat-card) → plain HTML + Tailwind + optional cva

## Anatomy — Radix-based Component

Use `select.tsx` as the canonical reference. Pattern:

```tsx
import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/shared/lib/cn";

function DialogContent({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={cn("fixed inset-0 z-50 bg-black/60 ...")} />
      <DialogPrimitive.Content
        className={cn("fixed z-50 ...", className)}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
```

Rules:
- Import Radix as namespace: `import * as XPrimitive from "@radix-ui/react-x"`
- Type props via `ComponentPropsWithoutRef<typeof XPrimitive.Part>`
- Always accept and merge `className` through `cn()`
- Spread `...props` last onto the Radix primitive
- Use `function` declarations, not `const` arrows
- Re-export Radix compound parts that need no wrapper: `const Dialog = DialogPrimitive.Root`

## Anatomy — Variants Component (cva)

Use `button.tsx` / `badge.tsx` as reference. Pattern:

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";

const fooVariants = cva("base-classes", {
  variants: {
    variant: { default: "...", secondary: "..." },
    size: { default: "...", sm: "...", lg: "..." },
  },
  defaultVariants: { variant: "default", size: "default" },
});

type FooProps = HTMLAttributes<HTMLElement> & VariantProps<typeof fooVariants>;

function Foo({ className, variant, size, ...props }: FooProps) {
  return <div className={cn(fooVariants({ variant, size }), className)} {...props} />;
}

export { Foo, fooVariants };
```

Rules:
- Export both the component and the `*Variants` function
- `className` always last in `cn()` so consumer can override

## Anatomy — Plain Visual Component

Use `card.tsx` as reference. No cva, no Radix — just typed wrapper:

```tsx
function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border ...", className)} {...props} />;
}
```

## Sourcing Component Code

1. Check [shadcn/ui registry](https://ui.shadcn.com/docs/components) for the component
2. Copy the code, then adapt to project conventions:
   - Replace `React.forwardRef` → plain `function` (React 19 supports ref forwarding natively)
   - Replace `React.ComponentPropsWithoutRef` → `import type { ComponentPropsWithoutRef } from "react"`
   - Replace `@/lib/utils` → `@/shared/lib/cn`
   - Remove `"use client"` directives (not using Next.js)
   - Adjust token names to match project palette (see CSS variables in `app.css`)
3. If shadcn doesn't have the component, build from Radix + cva manually

## Installing Radix Packages

```bash
bun add @radix-ui/react-<primitive> --filter @jira-board/web
```

Run from workspace root. Each Radix primitive is a separate package.

## File Placement (FSD)

| What | Where |
|------|-------|
| Reusable primitive (button, dialog, select, tooltip) | `apps/web/src/shared/ui/<component>.tsx` |
| Re-export | Add to `apps/web/src/shared/ui/index.ts` |
| Composed widget (filters-panel, sprint-board) | `apps/web/src/widgets/<name>/ui/` |
| Feature-specific UI (sync button) | `apps/web/src/features/<name>/ui/` |

Primitives in `shared/ui/` must be context-free — no business logic, no API calls.

## Animation Classes

Project uses `tw-animate-css`. Standard entrance classes:

```
data-[state=open]:animate-in data-[state=closed]:animate-out
data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
data-[side=bottom]:slide-in-from-top-2
```

## Design Token Convention

Use semantic CSS variable tokens, never raw colors:

| Token | Usage |
|-------|-------|
| `bg-background` / `text-foreground` | Page base |
| `bg-card` / `text-card-foreground` | Cards |
| `bg-popover` / `text-popover-foreground` | Dropdowns, dialogs |
| `bg-primary` / `text-primary-foreground` | Primary actions |
| `bg-secondary` / `text-secondary-foreground` | Secondary surfaces |
| `bg-accent` / `text-accent-foreground` | Hover states |
| `text-muted-foreground` | Subtle text |
| `border-border` / `border-input` | Borders |
| `ring-ring` | Focus rings |

## Icons

Use `lucide-react`. Standard size: `size-4` inside components, `size-5` standalone.

```tsx
import { ChevronDown, Check, X } from "lucide-react";
```

## Checklist

- [ ] Component accepts and merges `className`
- [ ] Props typed via `ComponentPropsWithoutRef` (Radix) or `HTMLAttributes` (plain)
- [ ] Uses `cn()` for class merging
- [ ] Semantic design tokens, no raw colors
- [ ] Exported from `shared/ui/index.ts` if it's a primitive
- [ ] Radix package installed via `bun add --filter @jira-board/web`
- [ ] `function` declarations, not arrow expressions
- [ ] No `forwardRef` (React 19)
- [ ] No `"use client"` directives
