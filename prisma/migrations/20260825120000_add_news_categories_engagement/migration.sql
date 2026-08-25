-- AlterTable
ALTER TABLE "News" ADD COLUMN "views" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "categoryId" TEXT;

-- CreateTable
CREATE TABLE "NewsCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsLike" (
    "id" TEXT NOT NULL,
    "newsId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsComment" (
    "id" TEXT NOT NULL,
    "newsId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsCategory_name_key" ON "NewsCategory"("name");

-- CreateIndex
CREATE INDEX "NewsLike_newsId_idx" ON "NewsLike"("newsId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsLike_newsId_userId_key" ON "NewsLike"("newsId", "userId");

-- CreateIndex
CREATE INDEX "NewsComment_newsId_idx" ON "NewsComment"("newsId");

-- CreateIndex
CREATE INDEX "News_categoryId_idx" ON "News"("categoryId");

-- AddForeignKey
ALTER TABLE "News" ADD CONSTRAINT "News_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "NewsCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsLike" ADD CONSTRAINT "NewsLike_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsLike" ADD CONSTRAINT "NewsLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsComment" ADD CONSTRAINT "NewsComment_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsComment" ADD CONSTRAINT "NewsComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
