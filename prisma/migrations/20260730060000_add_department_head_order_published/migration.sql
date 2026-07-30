-- AlterTable
ALTER TABLE "Department" ADD COLUMN "headEmployeeId" TEXT;
ALTER TABLE "Department" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Department" ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Department_headEmployeeId_idx" ON "Department"("headEmployeeId");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_headEmployeeId_fkey" FOREIGN KEY ("headEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
