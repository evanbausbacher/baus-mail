ALTER TABLE "domains" ADD COLUMN IF NOT EXISTS "is_default" boolean NOT NULL DEFAULT false;
ALTER TABLE "domains" ADD COLUMN IF NOT EXISTS "from_addresses" text;
