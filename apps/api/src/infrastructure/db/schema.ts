import { pgTable, text, integer, timestamp, serial, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";

export const issues = pgTable("issues", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  summary: text("summary").notNull(),
  status: text("status").notNull(),
  priority: text("priority"),
  type: text("type").notNull(),
  assignee: text("assignee"),
  reporter: text("reporter"),
  projectKey: text("project_key").notNull(),
  sprintIds: text("sprint_ids").array().default([]),
  storyPoints: integer("story_points"),
  labels: text("labels").array(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  resolvedAt: timestamp("resolved_at"),

  flowPhase: text("flow_phase"),
  actualStart: timestamp("actual_start"),
  actualEnd: timestamp("actual_end"),
  lastEnteredActive: timestamp("last_entered_active"),
  lastEnteredQueue: timestamp("last_entered_queue"),
  activeTimeMin: integer("active_time_min").default(0),
  queueTimeMin: integer("queue_time_min").default(0),
  reworkCount: integer("rework_count").default(0),
  reworkWaitMin: integer("rework_wait_min").default(0),
  cycleTimeMin: integer("cycle_time_min").default(0),
});

export const issueStatusHistory = pgTable(
  "issue_status_history",
  {
    id: serial("id").primaryKey(),
    issueKey: text("issue_key").notNull(),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    changedAt: timestamp("changed_at").notNull(),
    author: text("author"),
  },
  (table) => [
    index("idx_ish_issue_key").on(table.issueKey),
    index("idx_ish_changed_at").on(table.changedAt),
  ],
);

export const sprints = pgTable(
  "sprints",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    state: text("state").notNull(),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    boardId: text("board_id").notNull(),
    projectKey: text("project_key").notNull().default(""),
  },
  (table) => [index("idx_sprints_project_key").on(table.projectKey)],
);

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  lead: text("lead"),
  lastSync: timestamp("last_sync"),
});

export const statuses = pgTable(
  "statuses",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    projectKey: text("project_key").notNull(),
    phase: text("phase").notNull().default("Active"),
    inCycle: boolean("in_cycle").notNull().default(true),
    order: integer("order").notNull().default(0),
  },
  (table) => [
    index("idx_statuses_project_key").on(table.projectKey),
    uniqueIndex("idx_statuses_name_project").on(table.name, table.projectKey),
  ],
);

export const projectMembers = pgTable(
  "project_members",
  {
    id: serial("id").primaryKey(),
    displayName: text("display_name").notNull(),
    projectKey: text("project_key").notNull(),
    role: text("role").notNull().default("-"),
  },
  (table) => [
    index("idx_pm_project_key").on(table.projectKey),
    uniqueIndex("idx_pm_name_project").on(table.displayName, table.projectKey),
  ],
);

export const syncLog = pgTable("sync_log", {
  id: serial("id").primaryKey(),
  startedAt: timestamp("started_at").notNull(),
  finishedAt: timestamp("finished_at"),
  status: text("status").notNull(),
  issuesSynced: integer("issues_synced").default(0),
  error: text("error"),
});
