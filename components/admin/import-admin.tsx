"use client";

import { useRef, useState, type FormEvent } from "react";

interface ImportResult {
  created: number;
  updated: number;
  errors: { row: number; message: string }[];
}

export function ImportAdmin() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
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

    const res = await fetch("/api/employees/import", { method: "POST", body });
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
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Импорт сотрудников из CSV</h1>
        <p className="text-sm text-gray-500">
          Обязательные колонки: <code>fullName</code>, <code>email</code>, <code>department</code>,{" "}
          <code>position</code>. Необязательные: <code>phone</code>, <code>birthDate</code> (в
          формате ГГГГ-ММ-ДД). Отдел и должность создаются автоматически, если ещё не существуют.
          Сотрудник обновляется, если email уже есть в системе.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
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
            Создано: <span className="font-medium">{result.created}</span> · Обновлено:{" "}
            <span className="font-medium">{result.updated}</span> · Ошибок:{" "}
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
