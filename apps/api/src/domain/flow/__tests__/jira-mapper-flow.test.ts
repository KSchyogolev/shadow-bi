import { describe, expect, it } from "bun:test";
import { mapJiraIssue } from "../../../infrastructure/jira/jira.mapper";
import type { JiraIssueWithChangelog } from "../../../infrastructure/jira/jira.types";

function makeJiraIssue(overrides?: Partial<JiraIssueWithChangelog>): JiraIssueWithChangelog {
  return {
    id: "10001",
    key: "PROJ-1",
    fields: {
      summary: "Test issue",
      status: { name: "In Progress" },
      priority: { name: "Medium" },
      issuetype: { name: "Story" },
      assignee: { displayName: "Alice" },
      reporter: { displayName: "Bob" },
      project: { key: "PROJ" },
      labels: [],
      created: "2026-01-01T00:00:00.000+0000",
      updated: "2026-01-15T00:00:00.000+0000",
      resolutiondate: null,
      statuscategorychangedate: null,
      customfield_10016: 5,
      sprint: null,
      customfield_10020: null,
    },
    ...overrides,
  };
}

const CHANGELOG_OPEN_TO_DONE = {
  histories: [
    {
      id: "1",
      created: "2026-01-01T00:00:00.000+0000",
      author: { displayName: "Alice" },
      items: [{ field: "status", fromString: null, toString: "Open" }],
    },
    {
      id: "2",
      created: "2026-01-02T00:00:00.000+0000",
      author: { displayName: "Alice" },
      items: [{ field: "status", fromString: "Open", toString: "In Progress" }],
    },
    {
      id: "3",
      created: "2026-01-04T00:00:00.000+0000",
      author: { displayName: "Alice" },
      items: [{ field: "status", fromString: "In Progress", toString: "Done" }],
    },
  ],
};

describe("mapJiraIssue — flow fields are zeroed (recalculated separately)", () => {
  it("returns zeroed flow fields without changelog", () => {
    const result = mapJiraIssue(makeJiraIssue());

    expect(result.flowPhase).toBeNull();
    expect(result.actualStart).toBeNull();
    expect(result.actualEnd).toBeNull();
    expect(result.activeTimeMin).toBe(0);
    expect(result.queueTimeMin).toBe(0);
    expect(result.reworkCount).toBe(0);
    expect(result.reworkWaitMin).toBe(0);
  });

  it("returns zeroed flow fields even with changelog present", () => {
    const result = mapJiraIssue(makeJiraIssue({ changelog: CHANGELOG_OPEN_TO_DONE }));

    expect(result.flowPhase).toBeNull();
    expect(result.actualStart).toBeNull();
    expect(result.actualEnd).toBeNull();
    expect(result.activeTimeMin).toBe(0);
    expect(result.queueTimeMin).toBe(0);
  });

  it("ignores custom flow fields from Jira", () => {
    const issue = makeJiraIssue({ changelog: CHANGELOG_OPEN_TO_DONE });
    issue.fields.customfield_10396 = { value: "Active" };
    issue.fields.customfield_10008 = "2026-01-10T00:00:00.000+0000";
    issue.fields.customfield_10392 = 999;
    issue.fields.customfield_10394 = 5;

    const result = mapJiraIssue(issue);

    expect(result.flowPhase).toBeNull();
    expect(result.actualStart).toBeNull();
    expect(result.activeTimeMin).toBe(0);
    expect(result.reworkCount).toBe(0);
  });

  it("still maps core issue fields correctly", () => {
    const result = mapJiraIssue(makeJiraIssue());

    expect(result.key).toBe("PROJ-1");
    expect(result.summary).toBe("Test issue");
    expect(result.status).toBe("In Progress");
    expect(result.assignee).toBe("Alice");
    expect(result.projectKey).toBe("PROJ");
  });
});
