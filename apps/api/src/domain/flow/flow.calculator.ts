import type { FlowFields, FlowPhase, StatusTransition } from "./flow.types";

type PhaseMap = Record<string, FlowPhase>;

export function calculateFlowFields(
  transitions: StatusTransition[],
  phaseMap: PhaseMap,
  inCycleSet: Set<string>,
): FlowFields {
  const result: FlowFields = {
    flowPhase: null,
    actualStart: null,
    actualEnd: null,
    lastEnteredActive: null,
    lastEnteredQueue: null,
    activeTimeMin: 0,
    queueTimeMin: 0,
    reworkCount: 0,
    reworkWaitMin: 0,
    cycleTimeMin: 0,
  };

  if (transitions.length === 0) return result;

  const phase = (status: string | null): FlowPhase | null =>
    status ? (phaseMap[status] ?? null) : null;

  let reworkEnteredAt: Date | null = null;

  for (let i = 0; i < transitions.length; i++) {
    const tx = transitions[i]!;
    const toPhase = phase(tx.toStatus);
    const fromPhase = phase(tx.fromStatus);

    if (toPhase === "Active") {
      if (!result.actualStart) result.actualStart = tx.changedAt;
      result.lastEnteredActive = tx.changedAt;
    }

    if (toPhase === "Queue") {
      result.lastEnteredQueue = tx.changedAt;
    }

    if (toPhase === "Done" && fromPhase !== "Done") {
      result.actualEnd = tx.changedAt;
    }

    if (toPhase === "Rework" && fromPhase !== "Rework") {
      result.reworkCount++;
      reworkEnteredAt = tx.changedAt;
    }

    if (reworkEnteredAt && toPhase !== "Rework") {
      result.reworkWaitMin += minutesBetween(reworkEnteredAt, tx.changedAt);
      reworkEnteredAt = null;
    }

    if (i > 0 && tx.fromStatus) {
      const prevTx = transitions[i - 1]!;
      const duration = minutesBetween(prevTx.changedAt, tx.changedAt);

      if (fromPhase === "Active") {
        result.activeTimeMin += duration;
      } else if (fromPhase === "Queue" || fromPhase === "Rework") {
        result.queueTimeMin += duration;
      }

      if (inCycleSet.has(tx.fromStatus)) {
        result.cycleTimeMin += duration;
      }
    }
  }

  const lastTransition = transitions[transitions.length - 1]!;
  result.flowPhase = phase(lastTransition.toStatus);

  return result;
}

function minutesBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 60_000);
}
