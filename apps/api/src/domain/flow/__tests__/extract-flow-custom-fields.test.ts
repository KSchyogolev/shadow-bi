import { describe, expect, it } from "bun:test";
import {
  extractFlowCustomFields,
  type FlowFieldMapping,
} from "../../../infrastructure/jira/jira.flow-fields";
import type { FlowFields } from "../flow.types";

const FIELD_MAP: FlowFieldMapping = {
  flowPhase: "customfield_10100",
  actualStart: "customfield_10101",
  actualEnd: "customfield_10102",
  lastEnteredActive: "customfield_10103",
  lastEnteredQueue: "customfield_10104",
  activeTimeMin: "customfield_10105",
  queueTimeMin: "customfield_10106",
  reworkCount: "customfield_10107",
  reworkWaitMin: "customfield_10108",
};

describe("extractFlowCustomFields", () => {
  it("returns empty FlowFields when no custom fields present", () => {
    const fields: Record<string, unknown> = {};
    const result = extractFlowCustomFields(fields, FIELD_MAP);

    expect(result.flowPhase).toBeNull();
    expect(result.actualStart).toBeNull();
    expect(result.actualEnd).toBeNull();
    expect(result.lastEnteredActive).toBeNull();
    expect(result.lastEnteredQueue).toBeNull();
    expect(result.activeTimeMin).toBe(0);
    expect(result.queueTimeMin).toBe(0);
    expect(result.reworkCount).toBe(0);
    expect(result.reworkWaitMin).toBe(0);
  });

  it("extracts all flow fields when fully populated", () => {
    const fields: Record<string, unknown> = {
      customfield_10100: { value: "Active" },
      customfield_10101: "2026-01-01T00:00:00.000+0000",
      customfield_10102: "2026-01-03T00:00:00.000+0000",
      customfield_10103: "2026-01-02T00:00:00.000+0000",
      customfield_10104: "2026-01-01T12:00:00.000+0000",
      customfield_10105: 120,
      customfield_10106: 60,
      customfield_10107: 2,
      customfield_10108: 45,
    };

    const result = extractFlowCustomFields(fields, FIELD_MAP);

    expect(result.flowPhase).toBe("Active");
    expect(result.actualStart).toEqual(new Date("2026-01-01T00:00:00.000+0000"));
    expect(result.actualEnd).toEqual(new Date("2026-01-03T00:00:00.000+0000"));
    expect(result.lastEnteredActive).toEqual(new Date("2026-01-02T00:00:00.000+0000"));
    expect(result.lastEnteredQueue).toEqual(new Date("2026-01-01T12:00:00.000+0000"));
    expect(result.activeTimeMin).toBe(120);
    expect(result.queueTimeMin).toBe(60);
    expect(result.reworkCount).toBe(2);
    expect(result.reworkWaitMin).toBe(45);
  });

  it("handles partial custom fields", () => {
    const fields: Record<string, unknown> = {
      customfield_10100: { value: "Queue" },
      customfield_10105: 300,
    };

    const result = extractFlowCustomFields(fields, FIELD_MAP);

    expect(result.flowPhase).toBe("Queue");
    expect(result.actualStart).toBeNull();
    expect(result.activeTimeMin).toBe(300);
    expect(result.queueTimeMin).toBe(0);
  });

  it("handles flowPhase as plain string", () => {
    const fields: Record<string, unknown> = {
      customfield_10100: "Done",
    };

    const result = extractFlowCustomFields(fields, FIELD_MAP);
    expect(result.flowPhase).toBe("Done");
  });

  it("ignores invalid flowPhase values", () => {
    const fields: Record<string, unknown> = {
      customfield_10100: { value: "InvalidPhase" },
    };

    const result = extractFlowCustomFields(fields, FIELD_MAP);
    expect(result.flowPhase).toBeNull();
  });

  it("returns empty when field mapping is empty", () => {
    const emptyMap: FlowFieldMapping = {};
    const fields: Record<string, unknown> = {
      customfield_10100: { value: "Active" },
    };

    const result = extractFlowCustomFields(fields, emptyMap);
    expect(result.flowPhase).toBeNull();
    expect(result.activeTimeMin).toBe(0);
  });

  it("handles null field values gracefully", () => {
    const fields: Record<string, unknown> = {
      customfield_10100: null,
      customfield_10101: null,
      customfield_10105: null,
    };

    const result = extractFlowCustomFields(fields, FIELD_MAP);
    expect(result.flowPhase).toBeNull();
    expect(result.actualStart).toBeNull();
    expect(result.activeTimeMin).toBe(0);
  });
});
