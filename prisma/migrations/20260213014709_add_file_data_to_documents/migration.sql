-- AlterTable
ALTER TABLE "project_documents" ADD COLUMN     "fileData" BYTEA,
ADD COLUMN     "mimeType" TEXT NOT NULL DEFAULT 'application/octet-stream';
