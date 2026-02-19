-- AlterEnum
ALTER TYPE "DocumentPhase" ADD VALUE 'MONITORING';

-- CreateTable
CREATE TABLE "cest_project_documents" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "phase" "DocumentPhase" NOT NULL,
    "templateItemId" TEXT,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/octet-stream',
    "fileData" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cest_project_documents_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "cest_project_documents" ADD CONSTRAINT "cest_project_documents_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "cest_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
