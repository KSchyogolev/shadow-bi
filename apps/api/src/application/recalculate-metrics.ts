import { statusHistoryRepo } from "../infrastructure/repositories/status-history.repo";
import { statusRepo } from "../infrastructure/repositories/status.repo";
import { issueRepo } from "../infrastructure/repositories/issue.repo";
import { calculateFlowFields } from "../domain/flow/flow.calculator";
import type { StatusTransition } from "../domain/flow/flow.types";

export async function recalculateProjectMetrics(projectKey: string) {
  const [phaseMap, inCycleSet] = await Promise.all([
    statusRepo.getPhaseMap(projectKey),
    statusRepo.getInCycleSet(projectKey),
  ]);

  if (Object.keys(phaseMap).length === 0) {
    throw new Error("No status phase mappings found. Sync and configure statuses first.");
  }

  const allTransitions = await statusHistoryRepo.findByProject(projectKey);

  const grouped = new Map<string, StatusTransition[]>();
  for (const t of allTransitions) {
    const arr = grouped.get(t.issueKey) ?? [];
    arr.push(t);
    grouped.set(t.issueKey, arr);
  }

  const issueKeys = await issueRepo.findKeysByProject(projectKey);
  let updated = 0;

  for (const key of issueKeys) {
    const transitions = grouped.get(key) ?? [];
    const fields = calculateFlowFields(transitions, phaseMap, inCycleSet);
    await issueRepo.updateFlowFields(key, fields);
    updated++;
  }

  return { updated };
}
