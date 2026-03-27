import { issueRepo } from "../infrastructure/repositories/issue.repo";
import { statusHistoryRepo } from "../infrastructure/repositories/status-history.repo";
import type { IssueFilters, PaginatedResult } from "../domain/issue/issue.types";
import type { Issue } from "../domain/issue/issue.entity";

export async function getFilteredIssues(
  filters: IssueFilters,
): Promise<PaginatedResult<Issue>> {
  return issueRepo.findFiltered(filters);
}

export async function getIssueByKey(key: string): Promise<Issue | null> {
  return issueRepo.findByKey(key);
}

export async function getIssueTransitions(issueKey: string) {
  return statusHistoryRepo.findByIssueKey(issueKey);
}

export async function getIssueStats() {
  const [total, byStatus, byPriority] = await Promise.all([
    issueRepo.countAll(),
    issueRepo.countByStatus(),
    issueRepo.countByPriority(),
  ]);

  return { total, byStatus, byPriority };
}
