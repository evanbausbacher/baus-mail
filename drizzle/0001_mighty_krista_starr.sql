CREATE TABLE IF NOT EXISTS "domains" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"api_key" text NOT NULL,
	"created_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_synced_at" timestamp with time zone,
	CONSTRAINT "domains_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "emails" (
	"id" text PRIMARY KEY NOT NULL,
	"domain_id" text NOT NULL,
	"type" text NOT NULL,
	"message_id" text,
	"from" text NOT NULL,
	"to" text NOT NULL,
	"cc" text,
	"bcc" text,
	"reply_to" text,
	"subject" text NOT NULL,
	"html" text,
	"text" text,
	"headers" text,
	"attachments" text,
	"in_reply_to" text,
	"references" text,
	"thread_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"synced_at" timestamp with time zone,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_starred" boolean DEFAULT false NOT NULL,
	"is_spam" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"labels" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sync_state" (
	"id" text PRIMARY KEY NOT NULL,
	"domain_id" text NOT NULL,
	"type" text NOT NULL,
	"last_cursor" text,
	"last_synced_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "emails" ADD CONSTRAINT "emails_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sync_state" ADD CONSTRAINT "sync_state_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "name_idx" ON "domains" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "emails_domain_type_created_idx" ON "emails" USING btree ("domain_id","type","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "domain_idx" ON "emails" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "type_idx" ON "emails" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thread_idx" ON "emails" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_id_idx" ON "emails" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "created_at_idx" ON "emails" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "is_deleted_idx" ON "emails" USING btree ("is_deleted");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "domain_type_idx" ON "sync_state" USING btree ("domain_id","type");