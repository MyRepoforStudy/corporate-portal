-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "hireDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "News" ADD COLUMN     "documentUrl" TEXT,
ADD COLUMN     "documentName" TEXT;

-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "rank" INTEGER NOT NULL DEFAULT 0;

-- DataMigration: best-effort seniority ranking for positions that already
-- exist (from CSV/AD import, which have no rank concept). Keyword-matched
-- against real titles from the bank's staffing sheet - HR can fine-tune
-- individual outliers afterward via the positions admin page.
UPDATE "Position" SET "rank" = CASE
  WHEN title ILIKE '%заместитель председателя%' THEN 90
  WHEN title ILIKE '%председатель%' THEN 100
  WHEN title ILIKE '%директор департамента%' THEN 85
  WHEN title ILIKE '%директор филиала%' THEN 85
  WHEN title ILIKE '%заместитель директора%' THEN 78
  WHEN title ILIKE '%главный бухгалтер%' THEN 80
  WHEN title ILIKE '%заместитель%' THEN 75
  WHEN title ILIKE '%руководитель%' THEN 78
  WHEN title ILIKE '%начальник управления%' THEN 70
  WHEN title ILIKE '%начальник отдела%' THEN 62
  WHEN title ILIKE '%начальник%' THEN 65
  WHEN title ILIKE '%комплаенс-контролер%' THEN 65
  WHEN title ILIKE '%корпоративный секретарь%' THEN 65
  WHEN title ILIKE '%внутренний контролер%' THEN 60
  WHEN title ILIKE '%главный%' THEN 50
  WHEN title ILIKE '%ведущий%' THEN 40
  WHEN title ILIKE '%младший специалист%' THEN 18
  WHEN title ILIKE '%специалист%' THEN 30
  WHEN title ILIKE '%кассир%' THEN 15
  WHEN title ILIKE '%комендант%' THEN 15
  WHEN title ILIKE '%архивариус%' THEN 15
  ELSE 10
END;
