"use client";

import { useRef, useState, type ReactNode } from "react";
import type { BirthdayReport } from "@/lib/birthday-import";

interface ImportResponse {
  applied: boolean;
  written: number;
  report: BirthdayReport;
}

function Details({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  if (count === 0) return null;
  return (
    <details className="rounded-md border border-gray-200 px-3 py-2">
      <summary className="cursor-pointer text-sm font-medium text-gray-900">
        {title} ({count})
      </summary>
      <ul className="mt-2 space-y-1 text-sm text-gray-700">{children}</ul>
    </details>
  );
}

/** Admin -> Импорт: birthdays from an HR list (xlsx / csv). "Проверить" only reports, "Записать" writes. */
export function BirthdaysImportAdmin() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [busy, setBusy] = useState<"check" | "apply" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResponse | null>(null);

  async function send(apply: boolean) {
    if (!file) {
      setError("Выберите файл .xlsx или .csv");
      return;
    }
    setError(null);
    setBusy(apply ? "apply" : "check");

    const body = new FormData();
    body.append("file", file);
    if (apply) body.append("apply", "1");
    if (overwrite) body.append("overwrite", "1");

    try {
      const res = await fetch("/api/admin/birthdays/import", { method: "POST", body });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Не удалось обработать файл");
        return;
      }
      setResult(data as ImportResponse);
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setBusy(null);
    }
  }

  function resetResult() {
    setResult(null);
    setError(null);
  }

  const report = result?.report;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Дни рождения из Excel</h2>
        <p className="text-sm text-gray-500">
          Файл <code>.xlsx</code> или <code>.csv</code> с колонками <code>Lastname</code> (фамилия), <code>FirstName</code>{" "}
          (имя), <code>Birthday</code> (день месяца) и <code>BirthMonth</code> (номер месяца). Люди сопоставляются с
          сотрудниками по фамилии и имени (отчество не важно; регистр, «ё»/«е», пробелы и дефисы тоже). Год рождения в
          файле не нужен: на сайте показываются только день и месяц. Сначала нажмите «Проверить» — запись в базу идёт
          только по кнопке «Записать». Тех, кого не нашли или кто совпал неоднозначно, портал не угадывает, а показывает
          списком.
        </p>
      </div>

      <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            resetResult();
          }}
          className="text-sm"
        />
        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={overwrite}
            onChange={(e) => {
              setOverwrite(e.target.checked);
              resetResult();
            }}
            className="mt-0.5 h-4 w-4 rounded border-gray-300"
          />
          <span>
            Заменять дату, если у сотрудника уже стоит другая (по умолчанию такие случаи только показываются списком)
          </span>
        </label>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void send(false)}
            disabled={busy !== null || !file}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {busy === "check" ? "Проверка..." : "Проверить"}
          </button>
          {report && !result?.applied && report.toWrite > 0 && (
            <button
              type="button"
              onClick={() => void send(true)}
              disabled={busy !== null}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {busy === "apply" ? "Запись..." : `Записать: ${report.toWrite}`}
            </button>
          )}
        </div>
      </div>

      {report && (
        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
          {result?.applied ? (
            <p className="text-sm font-medium text-green-700 dark:text-green-400">Записано дней рождения: {result.written}.</p>
          ) : (
            <p className="text-sm text-gray-900">
              Проверка: ничего не записано.{" "}
              {report.toWrite > 0 ? (
                <>
                  Будет записано: <span className="font-medium">{report.toWrite}</span>.
                </>
              ) : (
                "Записывать нечего."
              )}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Строк в файле: {report.rowsInFile} · уже стоит такая же дата: {report.unchanged} · не найдено в портале:{" "}
            {report.notFound.length} · неоднозначно: {report.ambiguous.length} · другая дата: {report.differs.length} ·
            ошибок в строках: {report.invalid.length}
          </p>
          <p className="text-xs text-gray-500">
            {result?.applied ? "Без дня рождения остаётся" : "Без дня рождения останется"} сотрудников: {report.withoutBirthday}
          </p>

          <Details title="Не найдены в портале" count={report.notFound.length}>
            {report.notFound.map((item) => (
              <li key={item.row}>
                Строка {item.row}: {item.name} — {item.value}
                {item.suggestions.length > 0 && (
                  <span className="text-gray-500"> · похоже на: {item.suggestions.join("; ")} (не применяется, исправьте имя в файле)</span>
                )}
              </li>
            ))}
          </Details>
          <Details title="Неоднозначно: подходит несколько сотрудников" count={report.ambiguous.length}>
            {report.ambiguous.map((item) => (
              <li key={item.row}>
                Строка {item.row}: {item.name} — {item.candidates.join("; ")}
              </li>
            ))}
          </Details>
          <Details title="У сотрудника уже стоит другая дата" count={report.differs.length}>
            {report.differs.map((item) => (
              <li key={item.rows.join("-")}>
                {item.name}: в портале {item.current}, в файле {item.inFile}
              </li>
            ))}
          </Details>
          <Details title="Один человек с разными датами в файле (не записаны)" count={report.conflicts.length}>
            {report.conflicts.map((item) => (
              <li key={item.name}>
                {item.name}: {item.rows.map((r) => `строка ${r.row} — ${r.value}`).join("; ")}
              </li>
            ))}
          </Details>
          <Details title="Совпали с отличием в буквах (проверьте)" count={report.approximate.length}>
            {report.approximate.map((item) => (
              <li key={item.row}>
                Строка {item.row}: в файле «{item.inFile}», в портале «{item.inPortal}»
              </li>
            ))}
          </Details>
          <Details title="Повторы в файле (одна и та же дата, пропущены)" count={report.duplicates.length}>
            {report.duplicates.map((item) => (
              <li key={item.row}>
                Строка {item.row} повторяет строку {item.ofRow}: {item.name}
              </li>
            ))}
          </Details>
          <Details title="Ошибки в строках" count={report.invalid.length}>
            {report.invalid.map((item) => (
              <li key={item.row} className="text-red-600 dark:text-red-400">
                Строка {item.row}: {item.message}
              </li>
            ))}
          </Details>
        </div>
      )}
    </div>
  );
}
