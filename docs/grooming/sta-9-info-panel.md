# ADR: Info Panel

**Issue:** [STA-9](linear://issue/STA-9)  
**Date:** 2026-03-30  
**Status:** Draft

---

apps/web/src/shared/ui/
├── workflow-info-panel.tsx   ← NEW
└── index.ts                  ← MODIFY (add export)

apps/web/src/widgets/settings-panel/ui/
└── index.tsx                 ← MODIFY (add import + render)