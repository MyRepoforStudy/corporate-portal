-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'HR';

-- CreateTable
CREATE TABLE "Workplace" (
    "id" TEXT NOT NULL,
    "building" TEXT,
    "floor" INTEGER NOT NULL,
    "room" TEXT NOT NULL,
    "deskNumber" TEXT NOT NULL,
    "positionX" DOUBLE PRECISION,
    "positionY" DOUBLE PRECISION,
    "employeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workplace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Workplace_employeeId_key" ON "Workplace"("employeeId");

-- CreateIndex
CREATE INDEX "Workplace_floor_idx" ON "Workplace"("floor");

-- CreateIndex
CREATE INDEX "Workplace_building_idx" ON "Workplace"("building");

-- AddForeignKey
ALTER TABLE "Workplace" ADD CONSTRAINT "Workplace_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
