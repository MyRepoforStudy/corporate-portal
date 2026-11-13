-- CreateTable
CREATE TABLE "AboutSection" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "parentId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "titleRu" TEXT NOT NULL,
    "titleKk" TEXT NOT NULL DEFAULT '',
    "titleKo" TEXT NOT NULL DEFAULT '',
    "bodyRu" TEXT NOT NULL DEFAULT '',
    "bodyKk" TEXT NOT NULL DEFAULT '',
    "bodyKo" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AboutSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AboutSection_key_key" ON "AboutSection"("key");

-- CreateIndex
CREATE INDEX "AboutSection_parentId_order_idx" ON "AboutSection"("parentId", "order");

-- AddForeignKey
ALTER TABLE "AboutSection" ADD CONSTRAINT "AboutSection_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "AboutSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

