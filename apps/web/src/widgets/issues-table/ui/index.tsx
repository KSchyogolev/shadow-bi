import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  useIssues,
  getStatusBadgeVariant,
  getFlowPhaseColor,
  getPriorityColor,
  getActiveQueueRatioColor,
  formatLeadTime,
} from "@/entities/issue";
import { useFiltersStore, buildIssueQueryParams } from "@/features/filter-issues";
import { useProjectStore } from "@/entities/project";
import { Badge, PageSpinner, Pagination } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";

type SortField = "createdAt" | "updatedAt" | "priority" | "status";
type SortOrder = "asc" | "desc";

type IssuesTableProps = {
  compact?: boolean;
};

export function IssuesTable({ compact = false }: IssuesTableProps) {
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);

  const selectedProject = useProjectStore((s) => s.selectedProject);
  const filters = useFiltersStore();

  const issueFilters = useMemo(() => {
    const limit = compact ? 10 : 50;
    const filterParams = buildIssueQueryParams(filters);
    return {
      project: selectedProject?.key,
      ...filterParams,
      page: compact ? 1 : page,
      limit,
      sort: sortField,
      order: sortOrder,
    };
  }, [
    selectedProject?.key,
    filters.sprintIds,
    filters.assignees,
    filters.issueTypes,
    filters.priorities,
    filters.labels,
    filters.dateFrom,
    filters.dateTo,
    compact,
    page,
    sortField,
    sortOrder,
  ]);

  const { data, isLoading, isError } = useIssues(issueFilters);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortHeader = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <th
      className="cursor-pointer select-none hover:bg-secondary/70 transition-colors px-4 py-3 text-left font-medium"
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
        )}
      </span>
    </th>
  );

  if (isLoading) {
    return <PageSpinner />;
  }

  if (isError || !data) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Failed to load issues.
      </p>
    );
  }

  const { data: issues, total, page: currentPage, limit } = data;
  const totalPages = Math.ceil(total / limit);

  if (issues.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No issues found.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-muted-foreground">
            <tr>
              <SortHeader field="createdAt">Key</SortHeader>
              <th className="px-4 py-3 text-left font-medium">Summary</th>
              <SortHeader field="status">Status</SortHeader>
              <th className="px-4 py-3 text-left font-medium">Flow Phase</th>
              <th className="px-4 py-3 text-left font-medium">Assignee</th>
              <th className="px-4 py-3 text-left font-medium">SP</th>
              <th className="px-4 py-3 text-left font-medium">Cycle Time</th>
              <th className="px-4 py-3 text-left font-medium">Lead Time</th>
              <th className="px-4 py-3 text-left font-medium">
                Active / Queue
              </th>
              <th className="px-4 py-3 text-left font-medium">Rework</th>
              <SortHeader field="priority">Priority</SortHeader>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => {
              const totalTime = issue.activeTimeMin + issue.queueTimeMin;
              const ratio =
                totalTime > 0 ? issue.activeTimeMin / totalTime : 0;
              return (
                <tr
                  key={issue.key}
                  className="border-b border-border hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/issues/${issue.key}`}
                      className="text-primary hover:underline"
                    >
                      {issue.key}
                    </Link>
                  </td>
                  <td
                    className="px-4 py-3 max-w-xs truncate"
                    title={issue.summary}
                  >
                    {issue.summary}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={getStatusBadgeVariant(issue.status)}>
                      {issue.status}
                    </Badge>
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3",
                      getFlowPhaseColor(issue.flowPhase),
                    )}
                  >
                    {issue.flowPhase ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {issue.assignee ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {issue.storyPoints != null ? issue.storyPoints : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {(issue.activeTimeMin / 60).toFixed(1)}h
                  </td>
                  <td className="px-4 py-3">{formatLeadTime(issue)}</td>
                  <td className="px-4 py-3">
                    <span className={cn(getActiveQueueRatioColor(ratio))}>
                      {issue.activeTimeMin} / {issue.queueTimeMin} (
                      {(ratio * 100).toFixed(0)}%)
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {issue.reworkCount > 0 ? (
                      <Badge variant="destructive">{issue.reworkCount}</Badge>
                    ) : (
                      issue.reworkCount
                    )}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3",
                      getPriorityColor(issue.priority),
                    )}
                  >
                    {issue.priority ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!compact && (
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
