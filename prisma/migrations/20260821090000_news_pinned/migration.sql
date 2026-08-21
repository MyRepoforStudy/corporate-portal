-- AlterTable
ALTER TABLE "News" ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false;

-- DropIndex
DROP INDEX "News_isPublished_createdAt_idx";

-- CreateIndex
CREATE INDEX "News_isPublished_isPinned_createdAt_idx" ON "News"("isPublished", "isPinned", "createdAt");
