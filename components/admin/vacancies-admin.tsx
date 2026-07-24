"use client";

import { useRef, useState, type FormEvent } from "react";
import { Download } from "lucide-react";

interface VacancyImportResult {
  departmentsCreated: number;
  vacanciesCreated: number;
  errors: { row: number; message: string }[];
}

export function VacanciesAdmin() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VacancyImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Выберите CSV-файл");
      return;
    }

    setError(null);
    setResult(null);
    setIsSubmitting(true);

    const body = new FormData();
    body.append("file", file);

    const res = await fetch("/api/admin/vacancies/import", { method: "POST", body });
    setIsSubmitting(false);

    if (!res.ok) {
      const responseBody = await res.json().catch(() => null);
      setError(responseBody?.error ?? "Не удалось выполнить импорт");
      return;
    }

    setResult(await res.json());
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Импорт вакансий</h1>
        </div>
        <a
          href="/api/admin/vacancies/export"
          className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Экспорт в CSV
        </a>
      </div>
      <div>
        <p className="text-sm text-gray-500">
          Колонки: <code>department_path</code> (иерархия отделов через «&gt;», например
          «Департамент безопасности&gt;Управление мониторинга»), <code>position</code>,
          необязательная <code>note</code>. Каждая загрузка полностью заменяет текущий список
          вакансий — сотрудников файл не затрагивает. Отделы и должности создаются автоматически,
          если ещё не существуют.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="text-sm" />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {isSubmitting ? "Импорт..." : "Импортировать"}
        </button>
      </form>

      {result && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-900">
            Отделов создано: <span className="font-medium">{result.departmentsCreated}</span> ·
            Вакансий: <span className="font-medium">{result.vacanciesCreated}</span> · Ошибок:{" "}
            <span className="font-medium">{result.errors.length}</span>
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-red-600 dark:text-red-400">
              {result.errors.map((e, i) => (
                <li key={i}>
                  Строка {e.row}: {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
