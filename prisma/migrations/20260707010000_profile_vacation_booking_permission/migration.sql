-- AlterTable
ALTER TABLE "User" ADD COLUMN     "canBookRooms" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "vacationDaysTotal" INTEGER NOT NULL DEFAULT 28,
ADD COLUMN     "vacationDaysUsed" INTEGER NOT NULL DEFAULT 0;
