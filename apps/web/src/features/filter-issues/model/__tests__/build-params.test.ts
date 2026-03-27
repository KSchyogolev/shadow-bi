import { describe, expect, it } from "bun:test";
import {
  buildMetricsParams,
  buildIssueQueryParams,
  type FiltersState,
} from "../index";

const emptyFilters: FiltersState = {
  sprintIds: [],
  dateFrom: "",
  dateTo: "",
  assignees: [],
  issueTypes: [],
  priorities: [],
  labels: [],
};

describe("buildMetricsParams", () => {
  it("joins multiple values with commas", () => {
    const params = buildMetricsParams("PROJ", {
      ...emptyFilters,
      assignees: ["Alice", "Bob"],
      priorities: ["High", "Critical"],
    });
    expect(params.assignee).toBe("Alice,Bob");
    expect(params.priority).toBe("High,Critical");
  });

  it("returns undefined for empty arrays", () => {
    const params = buildMetricsParams("PROJ", emptyFilters);
    expect(params.assignee).toBeUndefined();
    expect(params.sprintId).toBeUndefined();
    expect(params.issueType).toBeUndefined();
    expect(params.priority).toBeUndefined();
    expect(params.labels).toBeUndefined();
  });
});

describe("buildIssueQueryParams", () => {
  it("joins multiple sprint IDs with commas", () => {
    const result = buildIssueQueryParams({
      ...emptyFilters,
      sprintIds: ["1", "2", "3"],
    });
    expect(result.sprint).toBe("1,2,3");
  });

  it("joins multiple assignees with commas", () => {
    const result = buildIssueQueryParams({
      ...emptyFilters,
      assignees: ["Alice", "Bob"],
    });
    expect(result.assignee).toBe("Alice,Bob");
  });

  it("joins multiple issue types with commas", () => {
    const result = buildIssueQueryParams({
      ...emptyFilters,
      issueTypes: ["Bug", "Task"],
    });
    expect(result.type).toBe("Bug,Task");
  });

  it("joins multiple priorities with commas", () => {
    const result = buildIssueQueryParams({
      ...emptyFilters,
      priorities: ["High", "Critical"],
    });
    expect(result.priority).toBe("High,Critical");
  });

  it("joins multiple labels with commas", () => {
    const result = buildIssueQueryParams({
      ...emptyFilters,
      labels: ["frontend", "bug"],
    });
    expect(result.labels).toBe("frontend,bug");
  });

  it("returns undefined for empty arrays and empty strings", () => {
    const result = buildIssueQueryParams(emptyFilters);
    expect(result.sprint).toBeUndefined();
    expect(result.assignee).toBeUndefined();
    expect(result.type).toBeUndefined();
    expect(result.priority).toBeUndefined();
    expect(result.labels).toBeUndefined();
    expect(result.dateFrom).toBeUndefined();
    expect(result.dateTo).toBeUndefined();
  });

  it("passes date range when set", () => {
    const result = buildIssueQueryParams({
      ...emptyFilters,
      dateFrom: "2024-01-01",
      dateTo: "2024-12-31",
    });
    expect(result.dateFrom).toBe("2024-01-01");
    expect(result.dateTo).toBe("2024-12-31");
  });

  it("handles single value the same as multiple", () => {
    const result = buildIssueQueryParams({
      ...emptyFilters,
      assignees: ["Alice"],
    });
    expect(result.assignee).toBe("Alice");
  });
});
