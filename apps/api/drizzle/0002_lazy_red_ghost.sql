CREATE TABLE "issue_status_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"issue_key" text NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"changed_at" timestamp NOT NULL,
	"author" text
);
--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "flow_phase" text;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "actual_start" timestamp;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "actual_end" timestamp;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "last_entered_active" timestamp;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "last_entered_queue" timestamp;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "active_time_min" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "queue_time_min" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "rework_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "rework_wait_min" integer DEFAULT 0;--> statement-breakpoint
CREATE INDEX "idx_ish_issue_key" ON "issue_status_history" USING btree ("issue_key");--> statement-breakpoint
CREATE INDEX "idx_ish_changed_at" ON "issue_status_history" USING btree ("changed_at");