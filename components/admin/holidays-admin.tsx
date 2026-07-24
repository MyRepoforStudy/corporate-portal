"use client";

import { useState, type FormEvent } from "react";
import type { Holiday } from "@prisma/client";
import { useCrudList } from "@/lib/hooks/use-crud-list";
import { toDateInputValue } from "@/lib/booking-time";

const emptyForm = { title: "", date: "" };

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export function HolidaysAdmin() {
  const { items, isLoading, create, update, remove } = useCrudList<Holiday>("/api/holidays");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const result = editingId ? await update(editingId, form) : await create(form);
    if (result) {
      setError(result);
      return;
    }
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(holiday: Holiday) {
    setEditingId(holiday.id);
    setForm({ title: holiday.title, date: toDateInputValue(new Date(holiday.date)) });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить праздник?")) return;
    const result = await remove(id);
    if (result) setError(result);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Праздники и выходные</h1>
        <p className="text-sm text-gray-500">
          Отображаются виджетом «Ближайшие праздники» на главной странице
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Название</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Дата</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {editingId ? "Сохранить" : "Добавить"}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={cancelEdit}
            className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Отмена
          </button>
        )}
        {error && <p className="w-full text-sm text-red-600 dark:text-red-400">{error}</p>}
      </form>

      {isLoading ? (
        <p className="text-sm text-gray-500">Загрузка...</p>
      ) : (
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          {items.map((holiday) => (
            <div key={holiday.id} className="flex items-center justify-between px-4 py-2.5">
              <div>
                <p className="text-sm font-medium text-gray-900">{holiday.title}</p>
                <p className="text-xs text-gray-500">{formatDate(holiday.date)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button onClick={() => startEdit(holiday)} className="text-sm text-brand-700 hover:underline dark:text-brand-300">
                  Изменить
                </button>
                <button onClick={() => handleDelete(holiday.id)} className="text-sm text-red-600 dark:text-red-400 hover:underline">
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
