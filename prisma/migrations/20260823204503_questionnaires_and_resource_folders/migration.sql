-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN "questionsJson" TEXT;

-- AlterTable
ALTER TABLE "AssessmentType" ADD COLUMN "definitionJson" TEXT;
ALTER TABLE "AssessmentType" ADD COLUMN "descriptionHe" TEXT;

-- CreateTable
CREATE TABLE "ResourceFolder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResourceFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ResourceFolder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Resource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "folderId" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "allowPatientView" BOOLEAN NOT NULL DEFAULT true,
    "allowPatientDownload" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnAssign" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Resource_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "ResourceFolder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Resource" ("allowPatientDownload", "allowPatientView", "createdAt", "description", "id", "isPublic", "notifyOnAssign", "title", "url") SELECT "allowPatientDownload", "allowPatientView", "createdAt", "description", "id", "isPublic", "notifyOnAssign", "title", "url" FROM "Resource";
DROP TABLE "Resource";
ALTER TABLE "new_Resource" RENAME TO "Resource";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
