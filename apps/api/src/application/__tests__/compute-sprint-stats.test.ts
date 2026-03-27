import { describe, expect, it } from "bun:test";
import {
  computeSprintStats,
  computeBurndown,
  type SprintIssue,
} from "../compute-sprint-stats";

const DAY = 24 * 60 * 60 * 1000;

const sprintStart = new Date("2025-01-06T00:00:00Z"); // Monday
const sprintEnd = new Date("2025-01-17T23:59:59Z"); // Friday (2 weeks)
const startMs = sprintStart.getTime();
const endMs = sprintEnd.getTime();

function issue(overrides: Partial<SprintIssue> = {}): SprintIssue {
  return {
    storyPoints: 3,
    flowPhase: "Queue",
    actualEnd: null,
    sprintIds: ["sprint-1"],
    createdAt: new Date("2025-01-01"),
    ...overrides,
  };
}

// ─── Scope ───────────────────────────────────────────────────────────

describe("scope: task inclusion", () => {
  it("includes tasks with no actualEnd", () => {
    const stats = computeSprintStats(
      [issue({ actualEnd: null })],
      startMs,
      endMs,
    );
    expect(stats.totalTasks).toBe(1);
    expect(stats.committedSp).toBe(3);
  });

  it("includes tasks with actualEnd >= sprintStart", () => {
    const stats = computeSprintStats(
      [issue({ actualEnd: new Date("2025-01-10"), flowPhase: "Done" })],
      startMs,
      endMs,
    );
    expect(stats.totalTasks).toBe(1);
  });

  it("excludes tasks with actualEnd < sprintStart (done before sprint)", () => {
    const stats = computeSprintStats(
      [issue({ actualEnd: new Date("2025-01-05"), flowPhase: "Done" })],
      startMs,
      endMs,
    );
    expect(stats.totalTasks).toBe(0);
    expect(stats.committedSp).toBe(0);
  });
});

// ─── Categories ──────────────────────────────────────────────────────

describe("categories: new / carry-over / added-mid", () => {
  it("new: single-sprint, created before start", () => {
    const stats = computeSprintStats(
      [issue({ sprintIds: ["sprint-1"], createdAt: new Date("2025-01-01") })],
      startMs,
      endMs,
    );
    expect(stats.newSp).toBe(3);
    expect(stats.carryOverSp).toBe(0);
    expect(stats.addedSp).toBe(0);
  });

  it("carry-over: multi-sprint", () => {
    const stats = computeSprintStats(
      [issue({ sprintIds: ["sprint-0", "sprint-1"], storyPoints: 5 })],
      startMs,
      endMs,
    );
    expect(stats.carryOverSp).toBe(5);
    expect(stats.newSp).toBe(0);
    expect(stats.addedSp).toBe(0);
  });

  it("added-mid: single-sprint, created between start and end", () => {
    const stats = computeSprintStats(
      [
        issue({
          sprintIds: ["sprint-1"],
          createdAt: new Date("2025-01-10"),
          storyPoints: 2,
        }),
      ],
      startMs,
      endMs,
    );
    expect(stats.addedSp).toBe(2);
    expect(stats.newSp).toBe(0);
  });

  it("created after sprint end is NOT added-mid", () => {
    const stats = computeSprintStats(
      [
        issue({
          sprintIds: ["sprint-1"],
          createdAt: new Date("2025-01-20"),
          storyPoints: 4,
        }),
      ],
      startMs,
      endMs,
    );
    expect(stats.addedSp).toBe(0);
    expect(stats.newSp).toBe(4);
  });

  it("newSp = committedSp - carryOverSp - addedSp", () => {
    const issues = [
      issue({ sprintIds: ["sprint-1"], createdAt: new Date("2025-01-01"), storyPoints: 5 }),
      issue({ sprintIds: ["sprint-0", "sprint-1"], storyPoints: 3 }),
      issue({ sprintIds: ["sprint-1"], createdAt: new Date("2025-01-10"), storyPoints: 2 }),
    ];
    const stats = computeSprintStats(issues, startMs, endMs);
    expect(stats.committedSp).toBe(10);
    expect(stats.carryOverSp).toBe(3);
    expect(stats.addedSp).toBe(2);
    expect(stats.newSp).toBe(5);
  });
});

// ─── Completed ───────────────────────────────────────────────────────

describe("completed: actualEnd within sprint window", () => {
  it("counts task done during sprint", () => {
    const stats = computeSprintStats(
      [
        issue({
          flowPhase: "Done",
          actualEnd: new Date("2025-01-10"),
          storyPoints: 5,
        }),
      ],
      startMs,
      endMs,
    );
    expect(stats.completedSp).toBe(5);
    expect(stats.doneTasks).toBe(1);
  });

  it("does NOT count task done after sprint end", () => {
    const stats = computeSprintStats(
      [
        issue({
          flowPhase: "Done",
          actualEnd: new Date("2025-01-20"),
          storyPoints: 5,
        }),
      ],
      startMs,
      endMs,
    );
    expect(stats.completedSp).toBe(0);
    expect(stats.doneTasks).toBe(0);
  });

  it("does NOT count task with flowPhase != Done even if actualEnd in window", () => {
    const stats = computeSprintStats(
      [
        issue({
          flowPhase: "Active",
          actualEnd: new Date("2025-01-10"),
          storyPoints: 3,
        }),
      ],
      startMs,
      endMs,
    );
    expect(stats.completedSp).toBe(0);
  });
});

// ─── Remaining ───────────────────────────────────────────────────────

describe("remaining: flowPhase !== Done (current state)", () => {
  it("counts non-Done tasks as remaining", () => {
    const stats = computeSprintStats(
      [
        issue({ flowPhase: "Queue", storyPoints: 3 }),
        issue({ flowPhase: "Active", storyPoints: 5 }),
      ],
      startMs,
      endMs,
    );
    expect(stats.remainingSp).toBe(8);
  });

  it("Done task with actualEnd AFTER sprint is NOT remaining", () => {
    const stats = computeSprintStats(
      [
        issue({
          flowPhase: "Done",
          actualEnd: new Date("2025-01-20"),
          storyPoints: 5,
        }),
      ],
      startMs,
      endMs,
    );
    expect(stats.remainingSp).toBe(0);
  });

  it("remaining and completed are independent — don't sum to committed", () => {
    const issues = [
      issue({ flowPhase: "Done", actualEnd: new Date("2025-01-10"), storyPoints: 5 }),
      issue({ flowPhase: "Done", actualEnd: new Date("2025-01-20"), storyPoints: 3 }),
      issue({ flowPhase: "Active", storyPoints: 2 }),
    ];
    const stats = computeSprintStats(issues, startMs, endMs);
    expect(stats.committedSp).toBe(10);
    expect(stats.completedSp).toBe(5); // only the one done within window
    expect(stats.remainingSp).toBe(2); // only the Active task
    expect(stats.completedSp + stats.remainingSp).not.toBe(stats.committedSp);
  });
});

// ─── Burndown ────────────────────────────────────────────────────────

describe("burndown: burns by actualEnd date", () => {
  const closedSprint = {
    startMs,
    endMs,
    state: "closed" as const,
    startDate: sprintStart,
    endDate: sprintEnd,
  };

  it("starts at total scope points", () => {
    const bd = computeBurndown(
      [issue({ storyPoints: 5 }), issue({ storyPoints: 3 })],
      closedSprint,
    );
    expect(bd[0]!.remaining).toBe(8);
  });

  it("remaining decreases when actualEnd <= current date and flowPhase is Done", () => {
    const issues = [
      issue({ storyPoints: 5, flowPhase: "Done", actualEnd: new Date("2025-01-08") }),
      issue({ storyPoints: 3 }),
    ];
    const bd = computeBurndown(issues, closedSprint);
    expect(bd[0]!.remaining).toBe(8); // day 0 = Jan 6
    expect(bd[2]!.remaining).toBe(3); // day 2 = Jan 8, 5 SP burned
  });

  it("reopened task (actualEnd set, flowPhase != Done) stays remaining", () => {
    const issues = [
      issue({ storyPoints: 5, flowPhase: "Active", actualEnd: new Date("2025-01-10") }),
      issue({ storyPoints: 3, flowPhase: "Done", actualEnd: new Date("2025-01-12") }),
    ];
    const bd = computeBurndown(issues, closedSprint);
    // day 4 = Jan 10: reopened task has actualEnd <= d but flowPhase != Done → remaining
    // Done task has actualEnd Jan 12 > Jan 10 → also remaining
    expect(bd[4]!.remaining).toBe(8);
    // day 6 = Jan 12: Done task burns (actualEnd <= d, flowPhase Done), reopened stays remaining
    expect(bd[6]!.remaining).toBe(5);
    // last point: same — reopened is remaining, Done is burned
    expect(bd[bd.length - 1]!.remaining).toBe(5);
  });

  it("Done task with actualEnd after sprint stays remaining during sprint", () => {
    const issues = [
      issue({ storyPoints: 5, flowPhase: "Done", actualEnd: new Date("2025-01-20") }),
      issue({ storyPoints: 3, flowPhase: "Done", actualEnd: new Date("2025-01-10") }),
    ];
    const bd = computeBurndown(issues, closedSprint);
    // task with actualEnd Jan 20 > any sprint date → remaining throughout
    expect(bd[0]!.remaining).toBe(8);
    // day 4 = Jan 10: 3 SP task burns
    expect(bd[4]!.remaining).toBe(5);
    // last point: Jan 20 task still not burned (actualEnd > endDate)
    expect(bd[bd.length - 1]!.remaining).toBe(5);
  });

  it("task with no actualEnd stays remaining throughout", () => {
    const issues = [
      issue({ storyPoints: 5, flowPhase: "Done", actualEnd: new Date("2025-01-08") }),
      issue({ storyPoints: 3, actualEnd: null }),
    ];
    const bd = computeBurndown(issues, closedSprint);
    expect(bd[0]!.remaining).toBe(8);
    expect(bd[2]!.remaining).toBe(3); // 5 SP burned at Jan 8
    expect(bd[bd.length - 1]!.remaining).toBe(3);
  });

  it("excludes issues done before sprint from scope", () => {
    const issues = [
      issue({ storyPoints: 5, actualEnd: new Date("2025-01-04") }),
      issue({ storyPoints: 3 }),
    ];
    const bd = computeBurndown(issues, closedSprint);
    expect(bd[0]!.remaining).toBe(3);
  });

  it("ideal line reaches 0 at the end", () => {
    const bd = computeBurndown(
      [issue({ storyPoints: 10 })],
      closedSprint,
    );
    const lastPoint = bd[bd.length - 1]!;
    expect(lastPoint.ideal).toBe(0);
  });
});
