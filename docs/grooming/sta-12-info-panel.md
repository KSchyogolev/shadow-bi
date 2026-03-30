# ADR: Info Panel

**Issue:** [STA-12](linear://issue/STA-12)  
**Date:** 2026-03-30  
**Status:** Draft

---

apps/web/src/
├── features/
│   └── settings-info/           # NEW feature
│       ├── ui/
│       │   └── index.tsx        # WorkflowStepsPanel component
│       └── index.ts             # Public exports
└── widgets/
    └── settings-panel/
        └── ui/
            └── index.tsx        # MODIFY: add WorkflowStepsPanel import
```

## Component Integration Diagram

```mermaid
graph TD
    subgraph "pages/settings"
        A[SettingsPage]
    end
    
    subgraph "widgets/settings-panel"
        B[SettingsPanel]
    end
    
    subgraph "features"
        C[settings-info/WorkflowStepsPanel]:::new
        D[sync-project/ProjectSyncCard]
        E[map-status-phase/StatusPhaseMappingCard]
        F[map-member-role/TeamMappingCard]
    end
    
    subgraph "shared/ui"
        G[Card components]
        H[PageHeader]
    end
    
    A --> B
    B --> C
    B --> D
    B --> E
    B --> F
    C --> G
    B --> H
    D --> G
    E --> G
    F --> G
    
    classDef new fill:#90EE90,stroke:#228B22