export type IssueFilters = {
  status?: string;
  priority?: string;
  type?: string;
  assignee?: string;
  sprint?: string;
  project?: string;
  labels?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  limit: number;
  sort: "createdAt" | "updatedAt" | "priority" | "status";
  order: "asc" | "desc";
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};
