import { describe, expect, it } from "bun:test";
import { calculateFlowFields } from "../flow.calculator";
import type { FlowPhase, StatusTransition } from "../flow.types";

const PHASE_MAP: Record<string, FlowPhase> = {
  "Open": "Queue",
  "Blocked": "Queue",
  "In Progress": "Active",
  "Need Rework": "Rework",
  "Review and Build": "Active",
  "Ready For Test": "Queue",
  "Testing": "Active",
  "Ready To Merge": "Queue",
  "Done": "Done",
  "Canceled": "Done",
};

const IN_CYCLE_SET = new Set([
  "In Progress",
  "Review and Build",
  "Testing",
  "Ready For Test",
  "Ready To Merge",
]);

function t(
  fromStatus: string | null,
  toStatus: string,
  minutesFromStart: number,
): StatusTransition {
  return {
    issueKey: "PROJ-1",
    fromStatus,
    toStatus,
    changedAt: new Date(Date.UTC(2026, 0, 1, 0, minutesFromStart)),
    author: "user",
  };
}

describe("calculateFlowFields", () => {
  it("returns empty fields for no transitions", () => {
    const result = calculateFlowFields([], PHASE_MAP, IN_CYCLE_SET);

    expect(result.flowPhase).toBeNull();
    expect(result.actualStart).toBeNull();
    expect(result.actualEnd).toBeNull();
    expect(result.activeTimeMin).toBe(0);
    expect(result.queueTimeMin).toBe(0);
    expect(result.reworkCount).toBe(0);
    expect(result.reworkWaitMin).toBe(0);
    expect(result.cycleTimeMin).toBe(0);
  });

  it("sets actualStart on first transition to Active status", () => {
    const transitions = [
      t(null, "Open", 0),
      t("Open", "In Progress", 60),
    ];

    const result = calculateFlowFields(transitions, PHASE_MAP, IN_CYCLE_SET);

    expect(result.actualStart).toEqual(new Date(Date.UTC(2026, 0, 1, 0, 60)));
  });

  it("sets actualEnd on transition to Done", () => {
    const transitions = [
      t(null, "Open", 0),
      t("Open", "In Progress", 60),
      t("In Progress", "Done", 180),
    ];

    const result = calculateFlowFields(transitions, PHASE_MAP, IN_CYCLE_SET);

    expect(result.actualEnd).toEqual(new Date(Date.UTC(2026, 0, 1, 0, 180)));
  });

  it("calculates active time from Active status durations", () => {
    const transitions = [
      t(null, "Open", 0),
      t("Open", "In Progress", 60),
      t("In Progress", "Review and Build", 120),
      t("Review and Build", "Ready For Test", 180),
    ];

    const result = calculateFlowFields(transitions, PHASE_MAP, IN_CYCLE_SET);

    expect(result.activeTimeMin).toBe(120);
  });

  it("calculates queue time from Queue status durations", () => {
    const transitions = [
      t(null, "Open", 0),
      t("Open", "In Progress", 60),
      t("In Progress", "Ready For Test", 120),
      t("Ready For Test", "Testing", 200),
    ];

    const result = calculateFlowFields(transitions, PHASE_MAP, IN_CYCLE_SET);

    expect(result.queueTimeMin).toBe(140); // 60 + 80
  });

  it("counts rework entries via Rework phase", () => {
    const transitions = [
      t(null, "Open", 0),
      t("Open", "In Progress", 60),
      t("In Progress", "Need Rework", 120),
      t("Need Rework", "In Progress", 180),
      t("In Progress", "Need Rework", 240),
      t("Need Rework", "In Progress", 300),
      t("In Progress", "Done", 360),
    ];

    const result = calculateFlowFields(transitions, PHASE_MAP, IN_CYCLE_SET);

    expect(result.reworkCount).toBe(2);
  });

  it("calculates rework wait time", () => {
    const transitions = [
      t(null, "Open", 0),
      t("Open", "In Progress", 60),
      t("In Progress", "Need Rework", 120),
      t("Need Rework", "In Progress", 150),
      t("In Progress", "Need Rework", 200),
      t("Need Rework", "In Progress", 250),
      t("In Progress", "Done", 300),
    ];

    const result = calculateFlowFields(transitions, PHASE_MAP, IN_CYCLE_SET);

    expect(result.reworkWaitMin).toBe(80); // 30 + 50
  });

  it("tracks lastEnteredActive and lastEnteredQueue", () => {
    const transitions = [
      t(null, "Open", 0),
      t("Open", "In Progress", 60),
      t("In Progress", "Ready For Test", 120),
      t("Ready For Test", "Testing", 180),
      t("Testing", "Ready To Merge", 240),
    ];

    const result = calculateFlowFields(transitions, PHASE_MAP, IN_CYCLE_SET);

    expect(result.lastEnteredActive).toEqual(new Date(Date.UTC(2026, 0, 1, 0, 180)));
    expect(result.lastEnteredQueue).toEqual(new Date(Date.UTC(2026, 0, 1, 0, 240)));
  });

  it("sets flowPhase based on last transition", () => {
    expect(
      calculateFlowFields([t(null, "Open", 0)], PHASE_MAP, IN_CYCLE_SET).flowPhase,
    ).toBe("Queue");

    expect(
      calculateFlowFields([t(null, "Open", 0), t("Open", "In Progress", 60)], PHASE_MAP, IN_CYCLE_SET).flowPhase,
    ).toBe("Active");

    expect(
      calculateFlowFields([
        t(null, "Open", 0),
        t("Open", "In Progress", 60),
        t("In Progress", "Done", 120),
      ], PHASE_MAP, IN_CYCLE_SET).flowPhase,
    ).toBe("Done");
  });

  it("handles full lifecycle with mixed phases", () => {
    const transitions = [
      t(null, "Open", 0),                          // Queue 0-30
      t("Open", "In Progress", 30),                // Active 30-90
      t("In Progress", "Review and Build", 90),    // Active 90-150
      t("Review and Build", "Ready For Test", 150),// Queue 150-200
      t("Ready For Test", "Testing", 200),          // Active 200-260
      t("Testing", "Need Rework", 260),             // Rework 260-300
      t("Need Rework", "In Progress", 300),         // Active 300-380
      t("In Progress", "Review and Build", 380),    // Active 380-400
      t("Review and Build", "Ready For Test", 400), // Queue 400-420
      t("Ready For Test", "Testing", 420),           // Active 420-450
      t("Testing", "Ready To Merge", 450),           // Queue 450-460
      t("Ready To Merge", "Done", 460),              // Done
    ];

    const result = calculateFlowFields(transitions, PHASE_MAP, IN_CYCLE_SET);

    expect(result.flowPhase).toBe("Done");
    expect(result.actualStart).toEqual(new Date(Date.UTC(2026, 0, 1, 0, 30)));
    expect(result.actualEnd).toEqual(new Date(Date.UTC(2026, 0, 1, 0, 460)));
    expect(result.reworkCount).toBe(1);
    expect(result.reworkWaitMin).toBe(40); // 260-300
    // Active: (30-150=120) + (200-260=60) + (300-400=100) + (420-450=30) = 310
    expect(result.activeTimeMin).toBe(310);
    // Queue: (0-30=30) + (150-200=50) + (260-300=40) + (400-420=20) + (450-460=10) = 150
    // (260-300 is Rework phase, counted as Queue)
    expect(result.queueTimeMin).toBe(150);
    // cycleTimeMin: sum of time in IN_CYCLE_SET statuses
    // In Progress: 60 + 60 + 80 + 20 = 220
    // Review and Build: 60 + 20 = 80
    // Ready For Test: 50 + 20 + 30 = 100
    // Testing: 60 + 30 = 90
    // Ready To Merge: 10
    // Total: 220 + 80 + 100 + 90 + 10 = 500 wait...let me recompute
    // fromStatus at each transition (i>0):
    // i=1: from=Open (not in set) → 0
    // i=2: from=In Progress (in set), duration=90-30=60 → 60
    // i=3: from=Review and Build (in set), duration=150-90=60 → 60
    // i=4: from=Ready For Test (in set), duration=200-150=50 → 50
    // i=5: from=Testing (in set), duration=260-200=60 → 60
    // i=6: from=Need Rework (not in set) → 0
    // i=7: from=In Progress (in set), duration=380-300=80 → 80
    // i=8: from=Review and Build (in set), duration=400-380=20 → 20
    // i=9: from=Ready For Test (in set), duration=420-400=20 → 20
    // i=10: from=Testing (in set), duration=450-420=30 → 30
    // i=11: from=Ready To Merge (in set), duration=460-450=10 → 10
    // Total: 60+60+50+60+80+20+20+30+10 = 390
    expect(result.cycleTimeMin).toBe(390);
  });

  it("calculates cycleTimeMin only for inCycle statuses", () => {
    const onlyActive = new Set(["In Progress"]);
    const transitions = [
      t(null, "Open", 0),
      t("Open", "In Progress", 60),
      t("In Progress", "Ready For Test", 180),
      t("Ready For Test", "Done", 240),
    ];

    const result = calculateFlowFields(transitions, PHASE_MAP, onlyActive);

    expect(result.cycleTimeMin).toBe(120);
  });

  it("uses custom phaseMap for unknown statuses", () => {
    const customMap: Record<string, FlowPhase> = {
      "To Do": "Queue",
      "Working": "Active",
      "Finished": "Done",
    };
    const customCycleSet = new Set(["Working"]);

    const transitions = [
      t(null, "To Do", 0),
      t("To Do", "Working", 60),
      t("Working", "Finished", 180),
    ];

    const result = calculateFlowFields(transitions, customMap, customCycleSet);

    expect(result.flowPhase).toBe("Done");
    expect(result.activeTimeMin).toBe(120);
    expect(result.queueTimeMin).toBe(60);
    expect(result.cycleTimeMin).toBe(120);
  });

  it("returns null phase for statuses not in phaseMap", () => {
    const transitions = [t(null, "Unknown Status", 0)];

    const result = calculateFlowFields(transitions, PHASE_MAP, IN_CYCLE_SET);

    expect(result.flowPhase).toBeNull();
  });
});
