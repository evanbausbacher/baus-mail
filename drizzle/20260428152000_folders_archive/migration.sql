CREATE TABLE IF NOT EXISTS "folders" (
  "id" text PRIMARY KEY NOT NULL,
  "domain_id" text NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamp with time zone,
  "updated_at" timestamp with time zone,
  CONSTRAINT "folders_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE cascade ON UPDATE no action
);

ALTER TABLE "emails" ADD COLUMN IF NOT EXISTS "is_archived" boolean DEFAULT false NOT NULL;
ALTER TABLE "emails" ADD COLUMN IF NOT EXISTS "folder_id" text;

DO $$ BEGIN
 ALTER TABLE "emails" ADD CONSTRAINT "emails_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "folders"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "folders_domain_idx" ON "folders" ("domain_id");
CREATE UNIQUE INDEX IF NOT EXISTS "folders_domain_name_unique_idx" ON "folders" ("domain_id","name");
CREATE INDEX IF NOT EXISTS "is_archived_idx" ON "emails" ("is_archived");
CREATE INDEX IF NOT EXISTS "folder_idx" ON "emails" ("folder_id");
