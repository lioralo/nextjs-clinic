-- AlterTable
ALTER TABLE "Note" ADD COLUMN "keyTopics" TEXT;
ALTER TABLE "Note" ADD COLUMN "noteDate" DATETIME;
ALTER TABLE "Note" ADD COLUMN "sessionNumber" INTEGER;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT,
    "providerId" TEXT NOT NULL,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "kind" TEXT NOT NULL DEFAULT 'APPOINTMENT',
    "title" TEXT,
    "meetingType" TEXT NOT NULL DEFAULT 'IN_PERSON',
    "meetingLink" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceIntervalWeeks" INTEGER,
    "recurrenceEndDate" DATETIME,
    "recurrenceGroupId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Appointment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Appointment" ("createdAt", "endAt", "id", "patientId", "providerId", "startAt", "status", "updatedAt") SELECT "createdAt", "endAt", "id", "patientId", "providerId", "startAt", "status", "updatedAt" FROM "Appointment";
DROP TABLE "Appointment";
ALTER TABLE "new_Appointment" RENAME TO "Appointment";
CREATE TABLE "new_Patient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "notesText" TEXT,
    "birthDate" DATETIME,
    "idNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CANDIDATE',
    "patientType" TEXT NOT NULL DEFAULT 'PRIVATE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" TEXT,
    CONSTRAINT "Patient_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Patient" ("createdAt", "email", "firstName", "id", "lastName", "notesText", "ownerId", "phone", "updatedAt") SELECT "createdAt", "email", "firstName", "id", "lastName", "notesText", "ownerId", "phone", "updatedAt" FROM "Patient";
DROP TABLE "Patient";
ALTER TABLE "new_Patient" RENAME TO "Patient";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
