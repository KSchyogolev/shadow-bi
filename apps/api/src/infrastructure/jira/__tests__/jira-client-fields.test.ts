import { describe, expect, it } from "bun:test";
import { buildIssueFields } from "../jira.client";
import type { FlowFieldMapping } from "../jira.flow-fields";

describe("buildIssueFields", () => {
  it("returns base fields when no flow mapping", () => {
    const fields = buildIssueFields();

    expect(fields).toContain("summary");
    expect(fields).toContain("status");
    expect(fields).toContain("customfield_10016");
    expect(fields).toContain("customfield_10020");
    expect(fields).not.toContain(undefined);
  });

  it("appends flow custom field IDs from mapping", () => {
    const mapping: FlowFieldMapping = {
      flowPhase: "customfield_10100",
      actualStart: "customfield_10101",
      activeTimeMin: "customfield_10105",
    };

    const fields = buildIssueFields(mapping);

    expect(fields).toContain("customfield_10100");
    expect(fields).toContain("customfield_10101");
    expect(fields).toContain("customfield_10105");
    expect(fields).toContain("summary");
  });

  it("does not duplicate existing fields", () => {
    const mapping: FlowFieldMapping = {
      flowPhase: "customfield_10100",
    };

    const fields = buildIssueFields(mapping);
    const unique = new Set(fields);

    expect(fields.length).toBe(unique.size);
  });

  it("skips undefined values in mapping", () => {
    const mapping: FlowFieldMapping = {
      flowPhase: "customfield_10100",
      actualStart: undefined,
      actualEnd: undefined,
    };

    const fields = buildIssueFields(mapping);

    expect(fields).toContain("customfield_10100");
    expect(fields).not.toContain(undefined);
  });
});
