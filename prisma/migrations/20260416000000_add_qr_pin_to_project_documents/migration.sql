-- AlterTable
ALTER TABLE "project_documents" ADD COLUMN IF NOT EXISTS "qrPin" STRING;

-- AlterTable
ALTER TABLE "cest_project_documents" ADD COLUMN IF NOT EXISTS "qrPin" STRING;
