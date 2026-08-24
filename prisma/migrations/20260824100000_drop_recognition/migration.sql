-- DropForeignKey
ALTER TABLE "Recognition" DROP CONSTRAINT "Recognition_fromEmployeeId_fkey";

-- DropForeignKey
ALTER TABLE "Recognition" DROP CONSTRAINT "Recognition_toEmployeeId_fkey";

-- DropTable
DROP TABLE "Recognition";
