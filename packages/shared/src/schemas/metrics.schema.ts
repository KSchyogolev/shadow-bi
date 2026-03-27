import { z } from "zod";

export const metricsFiltersSchema = z.object({
  projectKey: z.string(),
  sprintId: z.string().optional(),
  assignee: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  issueType: z.string().optional(),
  priority: z.string().optional(),
  labels: z.string().optional(),
});

export type MetricsFilters = z.infer<typeof metricsFiltersSchema>;

export const cycleTimePointSchema = z.object({
  issueKey: z.string(),
  cycleTimeHours: z.number(),
});
export type CycleTimePoint = z.infer<typeof cycleTimePointSchema>;

export const leadTimePointSchema = z.object({
  issueKey: z.string(),
  leadTimeHours: z.number(),
});
export type LeadTimePoint = z.infer<typeof leadTimePointSchema>;

export const timeInStatusPointSchema = z.object({
  status: z.string(),
  avgMinutes: z.number(),
  medianMinutes: z.number(),
  p90Minutes: z.number(),
});
export type TimeInStatusPoint = z.infer<typeof timeInStatusPointSchema>;

export const throughputPointSchema = z.object({
  period: z.string(),
  issuesCompleted: z.number().int(),
  spCompleted: z.number(),
});
export type ThroughputPoint = z.infer<typeof throughputPointSchema>;

export const reworkPointSchema = z.object({
  issueKey: z.string(),
  reworkCount: z.number().int(),
  reworkWaitMin: z.number(),
});
export type ReworkPoint = z.infer<typeof reworkPointSchema>;

export const flowEfficiencyPointSchema = z.object({
  issueKey: z.string(),
  activeMin: z.number(),
  queueMin: z.number(),
  ratio: z.number(),
});
export type FlowEfficiencyPoint = z.infer<typeof flowEfficiencyPointSchema>;

export const cycleTimeBySprintPointSchema = z.object({
  sprint: z.string(),
  medianHours: z.number(),
  p85Hours: z.number(),
  avgHours: z.number(),
  count: z.number().int(),
});
export type CycleTimeBySprintPoint = z.infer<
  typeof cycleTimeBySprintPointSchema
>;

export const hoursPerSpPointSchema = z.object({
  sprint: z.string().nullable(),
  assignee: z.string().nullable(),
  avgHoursPerSP: z.number(),
});
export type HoursPerSpPoint = z.infer<typeof hoursPerSpPointSchema>;

export const assigneePerformanceSchema = z.object({
  assignee: z.string(),
  issuesCompleted: z.number().int(),
  spCompleted: z.number(),
  spCommitted: z.number(),
  avgSpPerSprint: z.number(),
  sprintCount: z.number().int(),
  avgCycleTimeHours: z.number(),
  avgLeadTimeHours: z.number(),
  reworkRate: z.number(),
  activeRatio: z.number(),
  avgHoursPerSP: z.number(),
});
export type AssigneePerformance = z.infer<typeof assigneePerformanceSchema>;

export const assigneeTrendPointSchema = z.object({
  assignee: z.string(),
  period: z.string(),
  throughput: z.number().int(),
  avgCycleTime: z.number(),
});
export type AssigneeTrendPoint = z.infer<typeof assigneeTrendPointSchema>;

export const assigneeSprintMetricSchema = z.object({
  assignee: z.string(),
  sprint: z.string(),
  velocity: z.number(),
  avgCycleTimeHours: z.number(),
  reworkRate: z.number(),
});
export type AssigneeSprintMetric = z.infer<typeof assigneeSprintMetricSchema>;
