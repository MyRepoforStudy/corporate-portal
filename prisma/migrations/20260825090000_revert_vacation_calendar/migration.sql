-- DropForeignKey
ALTER TABLE "Vacation" DROP CONSTRAINT "Vacation_employeeId_fkey";

-- DropTable
DROP TABLE "Vacation";

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN "vacationStart" TIMESTAMP(3),
ADD COLUMN "vacationEnd" TIMESTAMP(3);
