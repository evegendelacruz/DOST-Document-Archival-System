-- AlterTable
ALTER TABLE "cest_projects" ADD COLUMN IF NOT EXISTS "companyLogoUrl" TEXT;
ALTER TABLE "cest_projects" ADD COLUMN IF NOT EXISTS "coordinates" TEXT;
