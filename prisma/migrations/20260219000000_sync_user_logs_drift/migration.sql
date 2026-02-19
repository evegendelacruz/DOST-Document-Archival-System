-- AlterTable (sync drift: these columns already exist in the database)
ALTER TABLE "user_logs" ADD COLUMN IF NOT EXISTS "details" TEXT;
ALTER TABLE "user_logs" ADD COLUMN IF NOT EXISTS "resourceId" UUID;
ALTER TABLE "user_logs" ADD COLUMN IF NOT EXISTS "resourceTitle" TEXT;
ALTER TABLE "user_logs" ADD COLUMN IF NOT EXISTS "resourceType" TEXT NOT NULL DEFAULT 'AUTH';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_logs_action_idx" ON "user_logs"("action");
CREATE INDEX IF NOT EXISTS "user_logs_resourceType_idx" ON "user_logs"("resourceType");
CREATE INDEX IF NOT EXISTS "user_logs_timestamp_idx" ON "user_logs"("timestamp");
CREATE INDEX IF NOT EXISTS "user_logs_userId_idx" ON "user_logs"("userId");
