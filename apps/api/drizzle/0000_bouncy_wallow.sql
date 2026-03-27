CREATE TABLE "issues" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"summary" text NOT NULL,
	"status" text NOT NULL,
	"priority" text,
	"type" text NOT NULL,
	"assignee" text,
	"reporter" text,
	"project_key" text NOT NULL,
	"sprint_id" text,
	"story_points" integer,
	"labels" text[],
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"resolved_at" timestamp,
	CONSTRAINT "issues_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"lead" text,
	CONSTRAINT "projects_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "sprints" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"state" text NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"board_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"started_at" timestamp NOT NULL,
	"finished_at" timestamp,
	"status" text NOT NULL,
	"issues_synced" integer DEFAULT 0,
	"error" text
);
