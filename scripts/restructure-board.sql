-- Разовая операция: заменить старое дерево «Правление» на заново импортированную структуру.
--
-- Что происходит (всё в одной транзакции):
--   1. Находится старое дерево: подразделение верхнего уровня «Правление» и всё, что под ним.
--   2. Тем сотрудникам нового дерева, у которых в старом есть тёзка (по ФИО), переносятся телефон, фото,
--      даты рождения и приёма, «о себе» и направление (только в пустые поля), а учётная запись входа
--      перепривязывается к новой карточке. Вакансии старого дерева переносятся в одноимённое подразделение
--      нового (если оно ровно одно), остальные пропадают вместе со старыми подразделениями - сколько, показано в отчёте.
--   3. Старые сотрудники и старые подразделения удаляются.
--   4. Импортированный блок «Руководство» становится верхним узлом «Правление», остальные 9 блоков
--      (подотчётные Совету директоров, под Правлением, 7 функциональных областей) уходят под него.
--
-- ЗАПУСК (на сервере, из папки проекта). По умолчанию это РЕПЕТИЦИЯ: всё выполняется и откатывается,
-- в базе ничего не меняется, на экран выводится отчёт:
--   docker compose exec -T postgres psql -U portal -d corporate_portal -v ON_ERROR_STOP=1 < scripts/restructure-board.sql
-- Применить по-настоящему (сначала сделайте бэкап pg_dump!):
--   docker compose exec -T postgres psql -U portal -d corporate_portal -v ON_ERROR_STOP=1 -v apply=1 < scripts/restructure-board.sql

SET client_encoding = 'UTF8';
BEGIN;

-- 0. ПРЕДОХРАНИТЕЛЬ. Перед любыми изменениями убеждаемся, что НОВАЯ структура на месте и полная.
--    Иначе скрипт останавливается и ничего не трогает. Это защищает от двух ошибок: повторного запуска
--    (тогда уже новое «Правление» приняли бы за старое) и импорта нового CSV до этого скрипта
--    (он вливается в старое «Правление», и «старое» дерево стало бы содержать новых людей).
CREATE TEMP TABLE block_names (name TEXT PRIMARY KEY) ON COMMIT DROP;
INSERT INTO block_names VALUES
  ('Подразделения подотчетные Совету директоров'),
  ('Подразделение под Правлением'),
  ('Функциональная область стратегии и рисков'),
  ('Функциональная область финансов'),
  ('Функциональная область общего управления'),
  ('Функциональная область продаж'),
  ('Функциональная область операционного управления'),
  ('Функциональная область IT'),
  ('Функциональная область бухгалтерского учета и отчетности');

CREATE TEMP TABLE new_tree ON COMMIT DROP AS
WITH RECURSIVE tree AS (
  SELECT id FROM "Department"
  WHERE "parentId" IS NULL AND (name = 'Руководство' OR name IN (SELECT name FROM block_names))
  UNION ALL
  SELECT d.id FROM "Department" d JOIN tree ON d."parentId" = tree.id
)
SELECT id FROM tree;

\echo
\echo '=== ПРОВЕРКА НОВОЙ СТРУКТУРЫ (импортированной из справочника) ==='
SELECT (SELECT count(*) FROM "Department" WHERE name = 'Руководство' AND "parentId" IS NULL) AS "блок «Руководство» (нужен 1)",
       (SELECT count(*) FROM "Department" WHERE "parentId" IS NULL AND name IN (SELECT name FROM block_names)) AS "остальных блоков (нужно 9)",
       (SELECT count(*) FROM "Employee" WHERE "departmentId" IN (SELECT id FROM new_tree)) AS "сотрудников в них (нужно не меньше 150)";

-- Если условие не выполнено, следующая строка падает с ошибкой guard_new_structure_missing_or_incomplete
CREATE TEMP TABLE guard (ok INTEGER CONSTRAINT guard_new_structure_missing_or_incomplete CHECK (ok = 1)) ON COMMIT DROP;
INSERT INTO guard
SELECT CASE WHEN (SELECT count(*) FROM "Department" WHERE name = 'Руководство' AND "parentId" IS NULL) = 1
             AND (SELECT count(*) FROM "Department" WHERE "parentId" IS NULL AND name IN (SELECT name FROM block_names)) = 9
             AND (SELECT count(*) FROM "Employee" WHERE "departmentId" IN (SELECT id FROM new_tree)) >= 150
       THEN 1 ELSE 0 END;

-- 1. Старое дерево: подразделение верхнего уровня «Правление» и всё под ним
CREATE TEMP TABLE old_depts ON COMMIT DROP AS
WITH RECURSIVE tree AS (
  SELECT id FROM "Department" WHERE trim(name) = 'Правление' AND "parentId" IS NULL
  UNION ALL
  SELECT d.id FROM "Department" d JOIN tree ON d."parentId" = tree.id
)
SELECT id FROM tree;

CREATE TEMP TABLE old_emps ON COMMIT DROP AS
SELECT id, "fullName" FROM "Employee" WHERE "departmentId" IN (SELECT id FROM old_depts);

-- Пары «старая карточка -> новая» по ФИО без учёта регистра; у одной новой карточки не больше одной старой
CREATE TEMP TABLE emp_pairs ON COMMIT DROP AS
SELECT old_id, new_id FROM (
  SELECT o.id AS old_id, n.id AS new_id,
         row_number() OVER (PARTITION BY n.id ORDER BY o."updatedAt" DESC) AS rn
  FROM "Employee" o
  JOIN "Employee" n ON lower(n."fullName") = lower(o."fullName")
  WHERE o.id IN (SELECT id FROM old_emps)
    AND n.id NOT IN (SELECT id FROM old_emps)
) pairs
WHERE rn = 1;

-- Соответствие «старое подразделение -> новое» по названию (корень старого дерева соответствует блоку «Руководство»,
-- который ниже переименовывается в «Правление»). Берём только однозначные совпадения.
CREATE TEMP TABLE dept_map ON COMMIT DROP AS
SELECT od.id AS old_id, min(nd.id) AS new_id
FROM "Department" AS od
JOIN "Department" AS nd
  ON lower(trim(nd.name)) = lower(trim(CASE WHEN od."parentId" IS NULL THEN 'Руководство' ELSE od.name END))
 AND nd.id NOT IN (SELECT id FROM old_depts)
WHERE od.id IN (SELECT id FROM old_depts)
GROUP BY od.id
HAVING count(*) = 1;

\echo
\echo '=== СТАРОЕ ДЕРЕВО «Правление» (будет удалено) ==='
SELECT (SELECT count(*) FROM old_depts) AS "подразделений",
       (SELECT count(*) FROM old_emps) AS "сотрудников",
       (SELECT count(*) FROM emp_pairs) AS "из них есть тёзка в новом дереве",
       (SELECT count(*) FROM "User" WHERE "employeeId" IN (SELECT id FROM old_emps)) AS "привязано учётных записей входа",
       (SELECT count(*) FROM "Vacancy" WHERE "departmentId" IN (SELECT id FROM old_depts)) AS "вакансий",
       (SELECT count(*) FROM "Vacancy" WHERE "departmentId" IN (SELECT old_id FROM dept_map)) AS "из них переносится в одноимённые новые подразделения";
\echo '--- Старые сотрудники БЕЗ тёзки в новом дереве (после удаления их не останется) ---'
SELECT "fullName" AS "ФИО" FROM old_emps WHERE id NOT IN (SELECT old_id FROM emp_pairs) ORDER BY 1;

-- 2. Переносим в новые карточки то, чего нет в справочнике (только в пустые поля)
UPDATE "Employee" AS n SET
  phone          = COALESCE(n.phone, o.phone),
  "photoUrl"     = COALESCE(n."photoUrl", o."photoUrl"),
  "birthDate"    = COALESCE(n."birthDate", o."birthDate"),
  "hireDate"     = COALESCE(n."hireDate", o."hireDate"),
  bio            = COALESCE(n.bio, o.bio),
  "activityArea" = COALESCE(n."activityArea", o."activityArea")
FROM emp_pairs AS p JOIN "Employee" AS o ON o.id = p.old_id
WHERE n.id = p.new_id;

-- ... и перепривязываем вход (если у новой карточки уже есть своя учётная запись - не трогаем)
UPDATE "User" AS u SET "employeeId" = p.new_id
FROM emp_pairs AS p
WHERE u."employeeId" = p.old_id
  AND NOT EXISTS (SELECT 1 FROM "User" AS x WHERE x."employeeId" = p.new_id);

-- ... и переносим вакансии в одноимённые новые подразделения (остальные удалятся ниже вместе со старыми)
UPDATE "Vacancy" AS v SET "departmentId" = m.new_id
FROM dept_map AS m
WHERE v."departmentId" = m.old_id;

-- 3. Удаляем старое. Порядок важен: сначала всё, что ссылается на сотрудников и подразделения
UPDATE "User" SET "employeeId" = NULL WHERE "employeeId" IN (SELECT id FROM old_emps);
DELETE FROM "Workplace" WHERE "employeeId" IN (SELECT id FROM old_emps);
UPDATE "Department" SET "headEmployeeId" = NULL WHERE "headEmployeeId" IN (SELECT id FROM old_emps);
DELETE FROM "Vacancy" WHERE "departmentId" IN (SELECT id FROM old_depts);
DELETE FROM "Employee" WHERE id IN (SELECT id FROM old_emps);
DELETE FROM "Department" WHERE id IN (SELECT id FROM old_depts);

-- 4. Новая структура: «Руководство» становится верхним узлом «Правление», остальные блоки уходят под него
UPDATE "Department" SET name = 'Правление' WHERE name = 'Руководство' AND "parentId" IS NULL;

WITH blocks AS (
  SELECT id, row_number() OVER (ORDER BY "order", name) AS rn
  FROM "Department"
  WHERE "parentId" IS NULL AND name IN (SELECT name FROM block_names)
)
UPDATE "Department" AS d
SET "parentId" = (SELECT id FROM "Department" WHERE name = 'Правление' AND "parentId" IS NULL),
    "order" = 1 + b.rn  -- после «Главного бухгалтера» и «Руководителя ИТ» (порядок 0 и 1), в прежнем порядке
FROM blocks AS b
WHERE d.id = b.id;

\echo
\echo '=== РЕЗУЛЬТАТ ==='
\echo '--- Подразделения верхнего уровня (ожидается «Правление» и то, что к справочнику не относится) ---'
SELECT d.name AS "узел", (SELECT count(*) FROM "Department" AS c WHERE c."parentId" = d.id) AS "дочерних"
FROM "Department" AS d WHERE d."parentId" IS NULL ORDER BY d."order", d.name;
\echo '--- Дочерние узлы «Правление» (ожидается 11) ---'
SELECT c."order" AS "порядок", c.name AS "узел"
FROM "Department" AS c
WHERE c."parentId" = (SELECT id FROM "Department" WHERE name = 'Правление' AND "parentId" IS NULL)
ORDER BY c."order";
SELECT (SELECT count(*) FROM "Employee") AS "сотрудников всего",
       (SELECT count(*) FROM "Department") AS "подразделений всего";

\if :{?apply}
  COMMIT;
  \echo
  \echo 'ГОТОВО: изменения применены.'
\else
  ROLLBACK;
  \echo
  \echo 'РЕПЕТИЦИЯ: в базе ничего не изменено. Чтобы применить, запустите ту же команду с -v apply=1 (после бэкапа).'
\endif
