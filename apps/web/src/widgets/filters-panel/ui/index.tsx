import { useFiltersStore } from "@/features/filter-issues";
import { useSprints } from "@/entities/sprint";
import { useProjectStore } from "@/entities/project";
import { useMembers } from "@/entities/member";
import { MultiSelect, type MultiSelectOption } from "@/shared/ui/multi-select";
import { Button, FilterField } from "@/shared/ui";
import { FilterIcon, XIcon } from "@/shared/ui/icons";
import { useMemo } from "react";

const ISSUE_TYPES: MultiSelectOption[] = [
  { value: "Story", label: "Story" },
  { value: "Bug", label: "Bug" },
  { value: "Task", label: "Task" },
  { value: "Sub-task", label: "Sub-task" },
];

const PRIORITIES: MultiSelectOption[] = [
  { value: "Critical", label: "Critical" },
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
];

export function FiltersPanel() {
  const filters = useFiltersStore();
  const projectKey = useProjectStore((s) => s.selectedProject?.key);
  const { data: sprintsData } = useSprints(projectKey);
  const { data: membersData } = useMembers(projectKey);

  const sprintOptions = useMemo<MultiSelectOption[]>(() => {
    if (!sprintsData?.data) return [];
    return sprintsData.data.map((s) => ({
      value: String(s.id),
      label: s.name,
    }));
  }, [sprintsData]);

  const assigneeOptions = useMemo<MultiSelectOption[]>(() => {
    if (!membersData) return [];
    return membersData
      .map((m) => ({ value: m.displayName, label: m.displayName }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [membersData]);

  const hasActiveFilters =
    filters.sprintIds.length > 0 ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.assignees.length > 0 ||
    filters.issueTypes.length > 0 ||
    filters.priorities.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3 min-h-7">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <FilterIcon className="size-4 text-muted-foreground" />
          Filters
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={filters.resetFilters}
            className="h-7 gap-1.5 text-xs text-muted-foreground"
          >
            <XIcon className="size-3" />
            Clear all
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <FilterField label="Sprint">
          <MultiSelect
            options={sprintOptions}
            value={filters.sprintIds}
            onValueChange={filters.setSprintIds}
            placeholder="All sprints"
          />
        </FilterField>

        <FilterField label="Date From">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) =>
              filters.setDateRange(e.target.value, filters.dateTo)
            }
            className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring"
          />
        </FilterField>

        <FilterField label="Date To">
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) =>
              filters.setDateRange(filters.dateFrom, e.target.value)
            }
            className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring"
          />
        </FilterField>

        <FilterField label="Assignee">
          <MultiSelect
            options={assigneeOptions}
            value={filters.assignees}
            onValueChange={filters.setAssignees}
            placeholder="All assignees"
          />
        </FilterField>

        <FilterField label="Type">
          <MultiSelect
            options={ISSUE_TYPES}
            value={filters.issueTypes}
            onValueChange={filters.setIssueTypes}
            placeholder="All types"
          />
        </FilterField>

        <FilterField label="Priority">
          <MultiSelect
            options={PRIORITIES}
            value={filters.priorities}
            onValueChange={filters.setPriorities}
            placeholder="All priorities"
          />
        </FilterField>
      </div>
    </div>
  );
}
