import type { FlowFields, FlowPhase } from "../../domain/flow/flow.types";

export type FlowFieldMapping = {
  storyPoints?: string;
  flowPhase?: string;
  actualStart?: string;
  actualEnd?: string;
  lastEnteredActive?: string;
  lastEnteredQueue?: string;
  activeTimeMin?: string;
  queueTimeMin?: string;
  reworkCount?: string;
  reworkWaitMin?: string;
};

export const FLOW_FIELD_MAPPING: FlowFieldMapping = {
  storyPoints: "customfield_10058",
  flowPhase: "customfield_10396",
  actualStart: "customfield_10008",
  actualEnd: "customfield_10009",
  lastEnteredActive: "customfield_10391",
  lastEnteredQueue: "customfield_10429",
  activeTimeMin: "customfield_10392",
  queueTimeMin: "customfield_10393",
  reworkCount: "customfield_10394",
  reworkWaitMin: "customfield_10395",
};

const VALID_PHASES = new Set<FlowPhase>(["Queue", "Active", "Done", "Rework"]);

export function extractFlowCustomFields(
  fields: Record<string, unknown>,
  mapping: FlowFieldMapping = FLOW_FIELD_MAPPING,
): FlowFields {
  return {
    flowPhase: extractPhase(fields, mapping.flowPhase),
    actualStart: extractDate(fields, mapping.actualStart),
    actualEnd: extractDate(fields, mapping.actualEnd),
    lastEnteredActive: extractDate(fields, mapping.lastEnteredActive),
    lastEnteredQueue: extractDate(fields, mapping.lastEnteredQueue),
    activeTimeMin: extractNumber(fields, mapping.activeTimeMin),
    queueTimeMin: extractNumber(fields, mapping.queueTimeMin),
    reworkCount: extractNumber(fields, mapping.reworkCount),
    reworkWaitMin: extractNumber(fields, mapping.reworkWaitMin),
  };
}

function extractPhase(
  fields: Record<string, unknown>,
  fieldId?: string,
): FlowPhase | null {
  if (!fieldId) return null;
  const raw = fields[fieldId];
  if (raw == null) return null;

  const value =
    typeof raw === "object" && "value" in raw
      ? (raw as { value: string }).value
      : typeof raw === "string"
        ? raw
        : null;

  if (value && VALID_PHASES.has(value as FlowPhase)) {
    return value as FlowPhase;
  }
  return null;
}

function extractDate(
  fields: Record<string, unknown>,
  fieldId?: string,
): Date | null {
  if (!fieldId) return null;
  const raw = fields[fieldId];
  if (raw == null || typeof raw !== "string") return null;
  const date = new Date(raw);
  return isNaN(date.getTime()) ? null : date;
}

function extractNumber(
  fields: Record<string, unknown>,
  fieldId?: string,
): number {
  if (!fieldId) return 0;
  const raw = fields[fieldId];
  if (raw == null || typeof raw !== "number") return 0;
  return raw;
}
