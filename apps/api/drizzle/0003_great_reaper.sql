CREATE TABLE "statuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"project_key" text NOT NULL,
	"phase" text DEFAULT 'Active' NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_statuses_project_key" ON "statuses" USING btree ("project_key");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_statuses_name_project" ON "statuses" USING btree ("name","project_key");