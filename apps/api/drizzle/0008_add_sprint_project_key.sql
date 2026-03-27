ALTER TABLE "sprints" ADD COLUMN "project_key" text NOT NULL DEFAULT '';
--> statement-breakpoint
CREATE INDEX "idx_sprints_project_key" ON "sprints" USING btree ("project_key");
