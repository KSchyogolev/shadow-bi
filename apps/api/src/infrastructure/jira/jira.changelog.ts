import type { StatusTransition } from "../../domain/flow/flow.types";
import type { JiraChangelog } from "./jira.types";

export function parseChangelog(
  issueKey: string,
  changelog: JiraChangelog,
): StatusTransition[] {
  const transitions: StatusTransition[] = [];

  for (const history of changelog.histories) {
    for (const item of history.items) {
      if (item.field !== "status") continue;

      transitions.push({
        issueKey,
        fromStatus: item.fromString,
        toStatus: item.toString,
        changedAt: new Date(history.created),
        author: history.author.displayName,
      });
    }
  }

  transitions.sort((a, b) => a.changedAt.getTime() - b.changedAt.getTime());

  return transitions;
}
