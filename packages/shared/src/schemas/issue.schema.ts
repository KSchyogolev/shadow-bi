import { z } from "zod";

export const flowPhaseSchema = z.enum(["Queue", "Active", "Done", "Rework"]);
export type FlowPhase = z.infer<typeof flowPhaseSchema>;

export const issueSchema = z.object({
  id: z.string(),
  key: z.string(),
  summary: z.string(),
  status: z.string(),
  priority: z.string(),
  type: z.string(),
  assignee: z.string().nullable(),
  reporter: z.string(),
  projectKey: z.string(),
  sprintIds: z.array(z.string()).default([]),
  storyPoints: z.number().nullable(),
  labels: z.array(z.string()),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  resolvedAt: z.coerce.date().nullable(),

  flowPhase: flowPhaseSchema.nullable(),
  actualStart: z.coerce.date().nullable(),
  actualEnd: z.coerce.date().nullable(),
  lastEnteredActive: z.coerce.date().nullable(),
  lastEnteredQueue: z.coerce.date().nullable(),
  activeTimeMin: z.number().int().default(0),
  queueTimeMin: z.number().int().default(0),
  reworkCount: z.number().int().default(0),
  reworkWaitMin: z.number().int().default(0),
  cycleTimeMin: z.number().int().default(0),
});

export type Issue = z.infer<typeof issueSchema>;

export const statusTransitionSchema = z.object({
  id: z.number().int(),
  issueKey: z.string(),
  fromStatus: z.string().nullable(),
  toStatus: z.string(),
  changedAt: z.coerce.date(),
  author: z.string().nullable(),
});

export type StatusTransition = z.infer<typeof statusTransitionSchema>;

export const issueFiltersSchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  type: z.string().optional(),
  assignee: z.string().optional(),
  sprint: z.string().optional(),
  project: z.string().optional(),
  labels: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  sort: z
    .enum(["createdAt", "updatedAt", "priority", "status"])
    .default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type IssueFilters = z.infer<typeof issueFiltersSchema>;
