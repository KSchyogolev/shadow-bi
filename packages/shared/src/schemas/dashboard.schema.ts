import { z } from "zod";

export const dashboardSummarySchema = z.object({
  totalIssues: z.number(),
  openIssues: z.number(),
  doneIssues: z.number(),
  avgCycleTimeDays: z.number().nullable(),
  byStatus: z.array(
    z.object({
      status: z.string(),
      count: z.number(),
    }),
  ),
  byPriority: z.array(
    z.object({
      priority: z.string(),
      count: z.number(),
    }),
  ),
});

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;

export const velocityPointSchema = z.object({
  sprintName: z.string(),
  committed: z.number(),
  completed: z.number(),
  newSp: z.number(),
  carryOverSp: z.number(),
  addedSp: z.number(),
});

export type VelocityPoint = z.infer<typeof velocityPointSchema>;

export const cycleTimeSchema = z.object({
  avgDays: z.number(),
  median: z.number(),
  byType: z.array(
    z.object({
      type: z.string(),
      avgDays: z.number(),
    }),
  ),
});

export type CycleTime = z.infer<typeof cycleTimeSchema>;
