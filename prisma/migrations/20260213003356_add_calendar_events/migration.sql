-- CreateTable
CREATE TABLE "calendar_events" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "bookedBy" TEXT,
    "bookedService" TEXT,
    "bookedPersonnel" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "staffInvolved" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);
