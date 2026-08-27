-- CreateEnum
CREATE TYPE "ItRequestStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItRequest" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ItRequestStatus" NOT NULL DEFAULT 'OPEN',
    "requesterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Document_order_idx" ON "Document"("order");

-- CreateIndex
CREATE INDEX "ItRequest_requesterId_idx" ON "ItRequest"("requesterId");

-- CreateIndex
CREATE INDEX "ItRequest_status_idx" ON "ItRequest"("status");

-- AddForeignKey
ALTER TABLE "ItRequest" ADD CONSTRAINT "ItRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
