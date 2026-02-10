-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "SetupStatus" AS ENUM ('PROPOSAL', 'APPROVED', 'ONGOING', 'WITHDRAWN', 'TERMINATED', 'EVALUATED', 'GRADUATED');

-- CreateEnum
CREATE TYPE "DocumentPhase" AS ENUM ('INITIATION', 'IMPLEMENTATION');

-- CreateEnum
CREATE TYPE "MapProgram" AS ENUM ('SETUP', 'CEST', 'SSCP', 'LGIA');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setup_projects" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "firm" TEXT,
    "typeOfFirm" TEXT,
    "address" TEXT,
    "coordinates" TEXT,
    "corporatorName" TEXT,
    "contactNumbers" TEXT[],
    "emails" TEXT[],
    "status" "SetupStatus" NOT NULL DEFAULT 'PROPOSAL',
    "prioritySector" TEXT,
    "firmSize" TEXT,
    "fund" TEXT,
    "typeOfFund" TEXT,
    "assignee" TEXT,
    "companyLogoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "setup_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_documents" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "phase" "DocumentPhase" NOT NULL,
    "templateItemId" TEXT,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cest_projects" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "projectTitle" TEXT NOT NULL,
    "location" TEXT,
    "beneficiaries" TEXT,
    "programFunding" TEXT,
    "status" TEXT,
    "approvedAmount" DOUBLE PRECISION,
    "releasedAmount" DOUBLE PRECISION,
    "projectDuration" TEXT,
    "staffAssigned" TEXT,
    "year" TEXT,
    "dateOfApproval" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cest_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "map_pins" (
    "id" UUID NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "label" TEXT NOT NULL,
    "district" INTEGER NOT NULL,
    "program" "MapProgram" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "map_pins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "archival_records" (
    "id" UUID NOT NULL,
    "userName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT,
    "contact" TEXT,
    "year" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "archival_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provinces" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "municipalities" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "provinceId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "municipalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barangays" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "municipalityId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barangays_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "setup_projects_code_key" ON "setup_projects"("code");

-- CreateIndex
CREATE UNIQUE INDEX "cest_projects_code_key" ON "cest_projects"("code");

-- CreateIndex
CREATE UNIQUE INDEX "provinces_name_key" ON "provinces"("name");

-- CreateIndex
CREATE UNIQUE INDEX "municipalities_name_provinceId_key" ON "municipalities"("name", "provinceId");

-- CreateIndex
CREATE UNIQUE INDEX "barangays_name_municipalityId_key" ON "barangays"("name", "municipalityId");

-- AddForeignKey
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "setup_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "municipalities" ADD CONSTRAINT "municipalities_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "provinces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barangays" ADD CONSTRAINT "barangays_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "municipalities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
