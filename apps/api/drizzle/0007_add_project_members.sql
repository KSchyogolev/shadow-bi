CREATE TABLE IF NOT EXISTS "project_members" (
  "id" serial PRIMARY KEY NOT NULL,
  "display_name" text NOT NULL,
  "project_key" text NOT NULL,
  "role" text DEFAULT '-' NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pm_project_key" ON "project_members" ("project_key");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_pm_name_project" ON "project_members" ("display_name", "project_key");
