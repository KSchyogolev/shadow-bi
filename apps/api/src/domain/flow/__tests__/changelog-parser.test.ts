import { describe, expect, it } from "bun:test";
import { parseChangelog } from "../../../infrastructure/jira/jira.changelog";
import type { JiraChangelog } from "../../../infrastructure/jira/jira.types";

describe("parseChangelog", () => {
  it("returns empty array for empty histories", () => {
    const changelog: JiraChangelog = { histories: [] };
    expect(parseChangelog("PROJ-1", changelog)).toEqual([]);
  });

  it("extracts status transitions only", () => {
    const changelog: JiraChangelog = {
      histories: [
        {
          id: "1",
          created: "2026-01-15T10:00:00.000+0000",
          author: { displayName: "Alice" },
          items: [
            { field: "status", fromString: "Open", toString: "In Progress" },
            { field: "assignee", fromString: null, toString: "Bob" },
          ],
        },
      ],
    };

    const result = parseChangelog("PROJ-1", changelog);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      issueKey: "PROJ-1",
      fromStatus: "Open",
      toStatus: "In Progress",
      changedAt: new Date("2026-01-15T10:00:00.000+0000"),
      author: "Alice",
    });
  });

  it("handles multiple status changes in one history entry", () => {
    const changelog: JiraChangelog = {
      histories: [
        {
          id: "1",
          created: "2026-01-15T10:00:00.000+0000",
          author: { displayName: "Alice" },
          items: [
            { field: "status", fromString: "Open", toString: "In Progress" },
            { field: "status", fromString: "In Progress", toString: "Done" },
          ],
        },
      ],
    };

    const result = parseChangelog("PROJ-1", changelog);

    expect(result).toHaveLength(2);
  });

  it("sorts transitions by changedAt ascending", () => {
    const changelog: JiraChangelog = {
      histories: [
        {
          id: "2",
          created: "2026-01-16T10:00:00.000+0000",
          author: { displayName: "Bob" },
          items: [
            { field: "status", fromString: "In Progress", toString: "Done" },
          ],
        },
        {
          id: "1",
          created: "2026-01-15T10:00:00.000+0000",
          author: { displayName: "Alice" },
          items: [
            { field: "status", fromString: "Open", toString: "In Progress" },
          ],
        },
      ],
    };

    const result = parseChangelog("PROJ-1", changelog);

    expect(result).toHaveLength(2);
    expect(result[0]!.toStatus).toBe("In Progress");
    expect(result[1]!.toStatus).toBe("Done");
  });

  it("handles null fromString (initial status)", () => {
    const changelog: JiraChangelog = {
      histories: [
        {
          id: "1",
          created: "2026-01-15T10:00:00.000+0000",
          author: { displayName: "Alice" },
          items: [
            { field: "status", fromString: null, toString: "Open" },
          ],
        },
      ],
    };

    const result = parseChangelog("PROJ-1", changelog);

    expect(result).toHaveLength(1);
    expect(result[0]!.fromStatus).toBeNull();
    expect(result[0]!.toStatus).toBe("Open");
  });
});
