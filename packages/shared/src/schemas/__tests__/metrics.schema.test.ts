import { describe, expect, it } from "bun:test";
import {
  metricsFiltersSchema,
  cycleTimePointSchema,
  leadTimePointSchema,
  timeInStatusPointSchema,
  throughputPointSchema,
  reworkPointSchema,
  flowEfficiencyPointSchema,
  hoursPerSpPointSchema,
  assigneePerformanceSchema,
  assigneeTrendPointSchema,
} from "../metrics.schema";

describe("metricsFiltersSchema", () => {
  it("parses minimal input with defaults", () => {
    const result = metricsFiltersSchema.parse({ projectKey: "PROJ" });

    expect(result.projectKey).toBe("PROJ");
    expect(result.sprintId).toBeUndefined();
    expect(result.assignee).toBeUndefined();
    expect(result.dateFrom).toBeUndefined();
    expect(result.dateTo).toBeUndefined();
    expect(result.issueType).toBeUndefined();
    expect(result.priority).toBeUndefined();
    expect(result.labels).toBeUndefined();
  });

  it("parses full input", () => {
    const result = metricsFiltersSchema.parse({
      projectKey: "PROJ",
      sprintId: "123",
      assignee: "john.doe",
      dateFrom: "2026-01-01",
      dateTo: "2026-03-18",
      issueType: "Story,Bug",
      priority: "High,Critical",
      labels: "backend,frontend",
    });

    expect(result.projectKey).toBe("PROJ");
    expect(result.sprintId).toBe("123");
    expect(result.assignee).toBe("john.doe");
    expect(result.dateFrom).toBe("2026-01-01");
    expect(result.dateTo).toBe("2026-03-18");
    expect(result.issueType).toBe("Story,Bug");
    expect(result.priority).toBe("High,Critical");
    expect(result.labels).toBe("backend,frontend");
  });

  it("requires projectKey", () => {
    expect(() => metricsFiltersSchema.parse({})).toThrow();
  });
});

describe("response schemas", () => {
  it("validates cycleTimePoint", () => {
    const result = cycleTimePointSchema.parse({
      issueKey: "PROJ-1",
      cycleTimeHours: 48.5,
    });
    expect(result.issueKey).toBe("PROJ-1");
    expect(result.cycleTimeHours).toBe(48.5);
  });

  it("validates leadTimePoint", () => {
    const result = leadTimePointSchema.parse({
      issueKey: "PROJ-1",
      leadTimeHours: 120,
    });
    expect(result.issueKey).toBe("PROJ-1");
  });

  it("validates timeInStatusPoint", () => {
    const result = timeInStatusPointSchema.parse({
      status: "In Progress",
      avgMinutes: 1440,
      medianMinutes: 1200,
      p90Minutes: 2880,
    });
    expect(result.status).toBe("In Progress");
    expect(result.p90Minutes).toBe(2880);
  });

  it("validates throughputPoint", () => {
    const result = throughputPointSchema.parse({
      period: "2026-W05",
      issuesCompleted: 12,
      spCompleted: 34,
    });
    expect(result.period).toBe("2026-W05");
  });

  it("validates reworkPoint", () => {
    const result = reworkPointSchema.parse({
      issueKey: "PROJ-1",
      reworkCount: 2,
      reworkWaitMin: 180,
    });
    expect(result.reworkCount).toBe(2);
  });

  it("validates flowEfficiencyPoint", () => {
    const result = flowEfficiencyPointSchema.parse({
      issueKey: "PROJ-1",
      activeMin: 300,
      queueMin: 100,
      ratio: 0.75,
    });
    expect(result.ratio).toBe(0.75);
  });

  it("validates hoursPerSpPoint", () => {
    const result = hoursPerSpPointSchema.parse({
      sprint: "Sprint 5",
      assignee: "alice",
      avgHoursPerSP: 6.5,
    });
    expect(result.avgHoursPerSP).toBe(6.5);
  });

  it("validates assigneePerformance", () => {
    const result = assigneePerformanceSchema.parse({
      assignee: "alice",
      issuesCompleted: 10,
      spCompleted: 25,
      avgCycleTimeHours: 36,
      avgLeadTimeHours: 72,
      reworkRate: 0.1,
      activeRatio: 0.7,
      avgHoursPerSP: 5.2,
    });
    expect(result.assignee).toBe("alice");
    expect(result.reworkRate).toBe(0.1);
  });

  it("validates assigneeTrendPoint", () => {
    const result = assigneeTrendPointSchema.parse({
      assignee: "bob",
      period: "2026-W10",
      throughput: 5,
      avgCycleTime: 24,
    });
    expect(result.throughput).toBe(5);
  });
});
