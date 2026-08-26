-- CreateTable
CREATE TABLE "CompassTip" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompassTip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompassTip_order_idx" ON "CompassTip"("order");
